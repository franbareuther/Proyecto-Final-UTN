<?php

namespace App\Services;

use App\Models\Animal;
use App\Models\HealthAudit;
use App\Models\User;
use App\Models\Vaccination;
use App\Models\VaccinationDose;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class HealthService
{
    private function lockedAnimal(Animal $animal, User $actor): Animal
    {
        $animal = Animal::withTrashed()->lockForUpdate()->findOrFail($animal->id);
        Gate::forUser($actor->fresh())->authorize('medical', $animal);
        abort_if($animal->trashed(), 403, 'El animal archivado es de solo lectura.');

        return $animal;
    }

    private function persist(Model $record): void
    {
        if (! $record->save()) {
            throw ValidationException::withMessages(['record' => 'No se pudo guardar el registro con su auditoría. No se aplicaron los cambios. Intentá nuevamente.']);
        }
    }

    private function audit(Animal $animal, Model $entry, string $type, User $actor, string $action, array $before): void
    {
        $this->persist(new HealthAudit(['animal_id' => $animal->id, 'record_type' => $type, 'record_id' => $entry->id,
            'actor_id' => $actor->id, 'action' => $action, 'before_values' => $before, 'after_values' => $this->values($entry)]));
    }

    private function values(Model $entry): array
    {
        return collect($entry->attributesToArray())->except(['id', 'animal_id', 'created_at', 'updated_at'])->all();
    }

    public function save(Animal $animal, User $actor, string $type, array $data, ?int $id = null): Model
    {
        abort_unless(in_array($type, ['consultations', 'vaccinations', 'treatments', 'controls'], true), 404);

        return DB::transaction(function () use ($animal, $actor, $type, $data, $id) {
            $animal = $this->lockedAnimal($animal, $actor);
            // Explicit request whitelist; attribution and ownership never come from the client.
            unset($data['recorded_by'], $data['updated_by'], $data['animal_id'], $data['id']);
            $entry = $id ? $animal->{$type}()->lockForUpdate()->findOrFail($id) : $animal->{$type}()->make();
            $before = $id ? $this->values($entry) : [];
            $entry->fill($data);
            if ($id) {
                $entry->updated_by = $actor->id;
            } else {
                $entry->recorded_by = $actor->id;
            }
            $this->persist($entry);
            if ($type === 'vaccinations') {
                $applicationDate = substr((string) $entry->application_date, 0, 10);
                if ($entry->next_dose_date && substr((string) $entry->next_dose_date, 0, 10) < $applicationDate) {
                    throw ValidationException::withMessages(['next_dose_date' => 'La próxima dosis no puede ser anterior a esta aplicación.']);
                }
                $fulfilled = VaccinationDose::with('source')->where('application_vaccination_id', $entry->id)->first();
                $following = VaccinationDose::with('application')->where('source_vaccination_id', $entry->id)->where('status', 'Aplicada')->first();
                if (($fulfilled && $applicationDate < substr((string) $fulfilled->source->application_date, 0, 10)) ||
                    ($following && $applicationDate > substr((string) $following->application->application_date, 0, 10))) {
                    throw ValidationException::withMessages(['application_date' => 'La corrección debe conservar el orden de las aplicaciones vinculadas.']);
                }
                $this->syncDose($animal, $entry, $actor);
            }
            $this->audit($animal, $entry, $type, $actor, $id ? 'Corrección' : 'Alta', $before);

            return $entry;
        }, 3);
    }

    private function syncDose(Animal $animal, Vaccination $entry, User $actor): void
    {
        $date = $entry->next_dose_date ? substr((string) $entry->next_dose_date, 0, 10) : null;
        $dose = VaccinationDose::where('source_vaccination_id', $entry->id)->lockForUpdate()->first();
        if ($dose) {
            if ($date !== $dose->scheduled_date->toDateString()) {
                if (! $date || $dose->status !== 'Pendiente') {
                    throw ValidationException::withMessages(['next_dose_date' => 'La programación se conserva. Para quitar un pendiente usá Cancelar con un motivo; una dosis resuelta no se reprograma.']);
                }
                $before = $this->values($dose);
                $dose->scheduled_date = $date;
                $this->persist($dose);
                $this->audit($animal, $dose, 'doses', $actor, 'Reprogramación', $before);
            }
        } elseif ($date) {
            $dose = new VaccinationDose(['animal_id' => $animal->id, 'source_vaccination_id' => $entry->id, 'scheduled_date' => $date]);
            $this->persist($dose);
            $this->audit($animal, $dose->refresh(), 'doses', $actor, 'Programación', []);
        }
    }

    public function resolve(Animal $animal, User $actor, int $id, string $action, array $data): void
    {
        DB::transaction(function () use ($animal, $actor, $id, $action, $data) {
            $animal = $this->lockedAnimal($animal, $actor);
            $dose = VaccinationDose::where('animal_id', $animal->id)->lockForUpdate()->findOrFail($id);
            if ($dose->status !== 'Pendiente') {
                throw ValidationException::withMessages(['dose' => 'Esta dosis ya fue resuelta. Actualizá la historia antes de continuar.']);
            }
            $before = $this->values($dose);
            if ($action === 'apply') {
                $source = $dose->source()->firstOrFail();
                if ($data['application_date'] < substr((string) $source->application_date, 0, 10)) {
                    throw ValidationException::withMessages(['application_date' => 'La aplicación no puede ser anterior a la vacunación de origen.']);
                }
                $application = $this->save($animal, $actor, 'vaccinations', $data);
                $dose->application_vaccination_id = $application->id;
                $dose->status = 'Aplicada';
            } else {
                abort_unless($action === 'cancel', 404);
                $dose->status = 'Cancelada';
                $dose->cancellation_reason = $data['cancellation_reason'];
            }
            $dose->resolved_by = $actor->id;
            $dose->resolved_at = now();
            $dose->legacy_unverified = false;
            $this->persist($dose);
            $this->audit($animal, $dose, 'doses', $actor, $dose->status, $before);
        }, 3);
    }
}
