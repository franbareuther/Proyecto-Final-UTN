<?php

namespace App\Services;

use App\Models\Adoption;
use App\Models\AdoptionMessage;
use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdoptionService
{
    private function ensure(bool $condition, string $message): void
    {
        if (! $condition) {
            throw ValidationException::withMessages(['status' => $message]);
        }
    }

    public function submit(Animal $animal, User $user, array $data): AdoptionRequest
    {
        abort_unless($user->role === 'adoptante', 403);

        return DB::transaction(function () use ($animal, $user, $data) {
            $locked = Animal::lockForUpdate()->findOrFail($animal->id);
            $shelter = Shelter::whereKey($locked->shelter_id)->lockForUpdate()->firstOrFail();
            $this->ensure($shelter->active, 'El refugio no recibe nuevas solicitudes.');
            $this->ensure($locked->availability_status === 'Disponible', 'Este animal ya no está disponible para solicitudes.');
            $this->ensure(! AdoptionRequest::where('animal_id', $locked->id)->where('user_id', $user->id)->whereIn('status', AdoptionRequest::ACTIVE)->exists(), 'Ya tenés una solicitud activa para este animal.');
            $request = new AdoptionRequest($data);
            $request->user_id = $user->id;
            $request->animal_id = $locked->id;
            $request->status = 'Nueva';
            $request->save();
            $this->history($request, $user, null, 'Nueva', 'Solicitud presentada por el adoptante.');

            return $request;
        }, 3);
    }

    public function transition(AdoptionRequest $request, User $actor, string $next, string $note): void
    {
        abort_unless($actor->role === 'admin', 403);
        DB::transaction(function () use ($request, $actor, $next, $note) {
            // Siempre bloquear primero el animal: serializa solicitudes y decisiones concurrentes.
            $animal = Animal::withTrashed()->lockForUpdate()->findOrFail($request->animal_id);
            $r = AdoptionRequest::lockForUpdate()->findOrFail($request->id);
            $shelter = Shelter::whereKey($animal->shelter_id)->lockForUpdate()->firstOrFail();
            abort_unless($shelter->active && (int) $actor->shelter_id === (int) $animal->shelter_id, 403);
            $allowed = ['Nueva' => ['En revisión', 'Aprobada', 'Rechazada'], 'En revisión' => ['Aprobada', 'Rechazada'], 'Aprobada' => ['Rechazada', 'Adoptado']];
            $this->ensure(in_array($next, $allowed[$r->status] ?? [], true), 'El cambio de estado solicitado no está permitido.');
            if ($next === 'Aprobada') {
                $this->ensure(! $animal->trashed() && $animal->availability_status === 'Disponible', 'El animal no está disponible.');
                $this->ensure(! $animal->requests()->where('status', 'Aprobada')->exists(), 'Ya existe una solicitud aprobada.');
                $animal->update(['availability_status' => 'En proceso de adopción']);
            }
            if ($next === 'Adoptado') {
                $this->ensure(! $animal->adoption()->exists(), 'El animal ya tiene una adopción registrada.');
                $this->ensure($animal->availability_status === 'En proceso de adopción', 'La disponibilidad del animal es inconsistente.');
                $adoption = Adoption::create(['adoption_request_id' => $r->id, 'animal_id' => $animal->id, 'user_id' => $r->user_id, 'registered_by' => $actor->id, 'adoption_date' => today()]);
                app(FollowUpService::class)->schedule($adoption);
                // El chat continúa después de adoptar: se avisa que ya está disponible el seguimiento.
                $notice = new AdoptionMessage(['type' => 'system', 'body' => '¡'.$animal->name.' ya tiene hogar! Desde el botón Seguimiento de este chat se cargan las fotos de cada control (jugando, durmiendo, comiendo y conviviendo) y los certificados de vacunas: una vez por semana el primer mes y después una vez por mes hasta los seis meses.']);
                $r->messages()->save($notice);
                $animal->update(['availability_status' => 'Adoptado']);
                foreach ($animal->requests()->where('id', '!=', $r->id)->whereIn('status', AdoptionRequest::ACTIVE)->lockForUpdate()->get() as $other) {
                    $this->setStatus($other, $actor, 'Rechazada', 'El animal fue adoptado por otra familia. Cierre al registrar la adopción definitiva.');
                }
            }
            if ($r->status === 'Aprobada' && $next === 'Rechazada') {
                $animal->update(['availability_status' => 'Disponible']);
            }
            $this->setStatus($r, $actor, $next, $note);
        }, 3);
    }

    /**
     * Cierre automático por falta de respuesta en el chat. No pasa por transition() porque no hay una
     * decisión del personal; conserva el mismo orden de bloqueo y la liberación de una reserva.
     */
    public function closeForInactivity(AdoptionRequest $request, string $note): bool
    {
        return DB::transaction(function () use ($request, $note) {
            $animal = Animal::withoutGlobalScopes()->withTrashed()->lockForUpdate()->findOrFail($request->animal_id);
            $r = AdoptionRequest::withoutGlobalScopes()->lockForUpdate()->findOrFail($request->id);
            if (! in_array($r->status, AdoptionRequest::ACTIVE, true) || ! $r->awaiting_reply_by) {
                return false;
            }
            if ($r->status === 'Aprobada') {
                $animal->update(['availability_status' => 'Disponible']);
            }
            // El historial exige un autor: queda el integrante del refugio que esperaba la respuesta.
            $this->setStatus($r, User::findOrFail($r->awaiting_reply_by), 'Rechazada', $note);

            return true;
        }, 3);
    }

    private function setStatus(AdoptionRequest $r, User $actor, string $next, string $note): void
    {
        $before = $r->status;
        $r->status = $next;
        $r->reviewed_by = $actor->id;
        $r->reviewed_at = now();
        if (! in_array($next, AdoptionRequest::ACTIVE, true)) {
            // Fuera del proceso previo a la adopción ya no corre el plazo de respuesta.
            $r->awaiting_reply_since = null;
            $r->awaiting_reply_by = null;
            $r->inactivity_warned_at = null;
        }
        $r->save();
        $this->history($r, $actor, $before, $next, $note);
    }

    private function history(AdoptionRequest $r, User $actor, ?string $before, string $next, string $note): void
    {
        $r->history()->create(['changed_by' => $actor->id, 'previous_status' => $before, 'new_status' => $next, 'observations' => $note]);
    }
}
