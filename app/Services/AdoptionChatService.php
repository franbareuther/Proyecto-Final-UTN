<?php

namespace App\Services;

use App\Models\AdoptionMessage;
use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdoptionChatService
{
    public const WARNING_HOURS = 24;

    public const LIMIT_HOURS = 48;

    public function __construct(private AdoptionService $adoptions, private FollowUpService $followUps) {}

    public function post(AdoptionRequest $request, User $author, string $body): AdoptionMessage
    {
        // Un plazo vencido se aplica antes de aceptar el mensaje, para no reabrir una solicitud cerrada.
        $this->enforce($request);

        return DB::transaction(function () use ($request, $author, $body) {
            $r = AdoptionRequest::withoutGlobalScopes()->lockForUpdate()->findOrFail($request->id);
            if ($r->status === 'Rechazada') {
                throw ValidationException::withMessages(['body' => 'La solicitud está cerrada. El chat queda disponible solo para consulta.']);
            }
            $message = new AdoptionMessage(['body' => $body, 'type' => 'message']);
            $message->user_id = $author->id;
            $r->messages()->save($message);
            $preAdoption = in_array($r->status, AdoptionRequest::ACTIVE, true);
            if ($author->id === $r->user_id) {
                $r->awaiting_reply_since = null;
                $r->awaiting_reply_by = null;
                $r->inactivity_warned_at = null;
            } elseif ($preAdoption && ! $r->awaiting_reply_since) {
                // El reloj arranca con el primer mensaje del refugio sin respuesta; los siguientes no lo reinician.
                $r->awaiting_reply_since = $message->created_at;
                $r->awaiting_reply_by = $author->id;
                $r->inactivity_warned_at = null;
            }
            $r->save();

            return $message;
        }, 3);
    }

    public function deadline(AdoptionRequest $request): ?Carbon
    {
        return $request->awaiting_reply_since?->copy()->addHours(self::LIMIT_HOURS);
    }

    /** Publica el aviso de las 24 h y cierra la solicitud a las 48 h. Es idempotente. */
    public function enforce(AdoptionRequest $request): void
    {
        $r = AdoptionRequest::withoutGlobalScopes()->find($request->id);
        if (! $r || ! $r->awaiting_reply_since || ! in_array($r->status, AdoptionRequest::ACTIVE, true)) {
            return;
        }
        $warningAt = $r->awaiting_reply_since->copy()->addHours(self::WARNING_HOURS);
        $limitAt = $this->deadline($r);
        if (! $r->inactivity_warned_at && now()->gte($warningAt)) {
            DB::transaction(function () use ($r, $warningAt, $limitAt) {
                $locked = AdoptionRequest::withoutGlobalScopes()->lockForUpdate()->findOrFail($r->id);
                if ($locked->inactivity_warned_at || ! $locked->awaiting_reply_since) {
                    return;
                }
                $this->system($locked, 'warning', 'Aviso: el refugio está esperando tu respuesta. Si no respondés antes del '.$limitAt->format('d/m/Y H:i').' la solicitud se finalizará por inactividad y '.$this->animalName($locked).' podrá ser adoptado por otra familia.', $warningAt);
                $locked->inactivity_warned_at = $warningAt;
                $locked->save();
            });
        }
        if (now()->gte($limitAt)) {
            $closed = $this->adoptions->closeForInactivity($r, 'Cierre automático: el adoptante no respondió el chat dentro de las '.self::LIMIT_HOURS.' horas.');
            if ($closed) {
                $this->system($r, 'system', 'La solicitud se finalizó por inactividad: no hubo respuesta en el chat dentro de las '.self::LIMIT_HOURS.' horas. '.$this->animalName($r).' vuelve a estar disponible para otras familias.', $limitAt);
            }
        }
    }

    /** Aplica los plazos vencidos de toda la red; lo usan la tarea programada y las vistas de solicitudes. */
    public function enforceDue(): int
    {
        $due = AdoptionRequest::withoutGlobalScopes()->whereIn('status', AdoptionRequest::ACTIVE)
            ->whereNotNull('awaiting_reply_since')
            ->where('awaiting_reply_since', '<=', now()->subHours(self::WARNING_HOURS))
            ->where(fn ($q) => $q->whereNull('inactivity_warned_at')->orWhere('awaiting_reply_since', '<=', now()->subHours(self::LIMIT_HOURS)))
            ->pluck('id');
        foreach ($due as $id) {
            $this->enforce(AdoptionRequest::withoutGlobalScopes()->findOrFail($id));
        }

        return $due->count();
    }

    /**
     * Conversaciones de la burbuja: las del refugio del personal o las propias del adoptante.
     * Incluye el proceso previo y las adopciones, porque el chat continúa después de adoptar.
     */
    public function inbox(User $user): Collection
    {
        $this->enforceDue();
        $adopter = $user->role === 'adoptante';
        $read = 'adoption_requests.'.($adopter ? 'adopter_read_at' : 'shelter_read_at');

        return AdoptionRequest::query()
            ->whereIn('status', [...AdoptionRequest::ACTIVE, 'Adoptado'])
            ->when($adopter, fn ($q) => $q->where('user_id', $user->id))
            ->with(['animal.photos', 'animal.shelter', 'user:id,name,last_name', 'lastMessage'])
            ->withMax('messages', 'created_at')
            ->withCount(['messages as unread' => fn ($q) => $q
                // Para el adoptante cuentan los mensajes del refugio y los avisos; para el refugio, los del adoptante y los avisos.
                ->where(fn ($q) => $adopter
                    ? $q->whereNull('adoption_messages.user_id')->orWhereColumn('adoption_messages.user_id', '!=', 'adoption_requests.user_id')
                    : $q->whereNull('adoption_messages.user_id')->orWhereColumn('adoption_messages.user_id', 'adoption_requests.user_id'))
                ->where(fn ($q) => $q->whereNull($read)->orWhereColumn('adoption_messages.created_at', '>', $read))])
            ->latest('id')->limit(200)->get()
            ->sortByDesc(fn ($r) => (string) ($r->messages_max_created_at ?? $r->created_at->toDateTimeString()))
            ->values()
            ->map(fn ($r) => [
                'id' => $r->id, 'status' => $r->status,
                'animal' => ['id' => $r->animal->id, 'name' => $r->animal->name, 'photo_url' => $r->animal->photo_url],
                'counterpart' => $this->counterpart($r, $user),
                'last' => $r->lastMessage ? ['body' => Str::limit($r->lastMessage->body, 90), 'type' => $r->lastMessage->type, 'created_at' => $r->lastMessage->created_at->toIso8601String(), 'mine' => $r->lastMessage->user_id === $user->id] : null,
                'unread' => (int) $r->unread,
                'deadline' => $this->deadline($r)?->toIso8601String(),
            ]);
    }

    /** Detalle de una conversación; al abrirla quedan leídos los mensajes de ese lado. */
    public function conversation(AdoptionRequest $request, User $user): array
    {
        $this->enforce($request);
        $r = AdoptionRequest::withoutGlobalScopes()->with(['animal.photos', 'animal.shelter', 'user:id,name,last_name', 'adoption'])->findOrFail($request->id);
        DB::table('adoption_requests')->where('id', $r->id)->update([$user->id === $r->user_id ? 'adopter_read_at' : 'shelter_read_at' => now()]);
        if ($r->adoption) {
            // Las adopciones anteriores al seguimiento reciben su calendario la primera vez que se consultan.
            $this->followUps->schedule($r->adoption);
        }

        return [
            'id' => $r->id, 'status' => $r->status,
            'animal' => ['id' => $r->animal->id, 'name' => $r->animal->name, 'photo_url' => $r->animal->photo_url],
            'counterpart' => $this->counterpart($r, $user),
            'requestUrl' => '/solicitudes/'.$r->id,
            'followUpUrl' => $r->adoption ? '/adopciones/'.$r->adoption->id.'/seguimiento' : null,
            // Controles habilitados y sin enviar: los que el botón Seguimiento invita a completar.
            'followUpPending' => $r->adoption ? $r->adoption->checkins()->whereNull('submitted_at')
                ->whereDate('due_date', '<=', today()->addDays(FollowUpService::OPENS_DAYS_BEFORE))->count() : null,
            'messages' => $r->messages()->with('author:id,name,last_name,role')->get(),
            'open' => $r->status !== 'Rechazada',
            'preAdoption' => in_array($r->status, AdoptionRequest::ACTIVE, true),
            'deadline' => $this->deadline($r)?->toIso8601String(),
            'limitHours' => self::LIMIT_HOURS,
        ];
    }

    private function counterpart(AdoptionRequest $r, User $user): string
    {
        return $user->id === $r->user_id
            ? ($r->animal->shelter?->name ?? 'Refugio')
            : trim($r->user->name.' '.$r->user->last_name);
    }

    private function system(AdoptionRequest $r, string $type, string $body, Carbon $at): void
    {
        $message = new AdoptionMessage(['body' => $body, 'type' => $type]);
        $message->created_at = $at;
        $message->updated_at = now();
        $r->messages()->save($message);
    }

    private function animalName(AdoptionRequest $r): string
    {
        return Animal::withoutGlobalScopes()->withTrashed()->whereKey($r->animal_id)->value('name') ?? 'El animal';
    }
}
