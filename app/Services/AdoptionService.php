<?php

namespace App\Services;

use App\Models\Adoption;
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

    public function transition(AdoptionRequest $request, User $actor, string $next, string $note, ?string $internalNotes = null): void
    {
        abort_unless($actor->role === 'admin', 403);
        DB::transaction(function () use ($request, $actor, $next, $note, $internalNotes) {
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
                Adoption::create(['adoption_request_id' => $r->id, 'animal_id' => $animal->id, 'user_id' => $r->user_id, 'registered_by' => $actor->id, 'adoption_date' => today()]);
                $animal->update(['availability_status' => 'Adoptado']);
                foreach ($animal->requests()->where('id', '!=', $r->id)->whereIn('status', AdoptionRequest::ACTIVE)->lockForUpdate()->get() as $other) {
                    $this->setStatus($other, $actor, 'Rechazada', 'El animal fue adoptado por otra familia. Cierre al registrar la adopción definitiva.');
                }
            }
            if ($r->status === 'Aprobada' && $next === 'Rechazada') {
                $animal->update(['availability_status' => 'Disponible']);
            }
            $this->setStatus($r, $actor, $next, $note, $internalNotes);
        }, 3);
    }

    private function setStatus(AdoptionRequest $r, User $actor, string $next, string $note, ?string $internalNotes = null): void
    {
        $before = $r->status;
        $r->status = $next;
        $r->reviewed_by = $actor->id;
        $r->reviewed_at = now();
        $r->save();
        $this->history($r, $actor, $before, $next, $note, $internalNotes);
    }

    private function history(AdoptionRequest $r, User $actor, ?string $before, string $next, string $note, ?string $internalNotes = null): void
    {
        $r->history()->create(['changed_by' => $actor->id, 'previous_status' => $before, 'new_status' => $next, 'observations' => $note, 'internal_notes' => $internalNotes]);
    }
}
