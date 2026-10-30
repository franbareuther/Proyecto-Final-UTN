<?php

namespace App\Services;

use App\Models\Adoption;
use App\Models\FollowUpCheckin;
use App\Models\User;
use App\Models\VaccinationCertificate;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class FollowUpService
{
    public const CATEGORIES = ['Jugando', 'Durmiendo', 'Comiendo', 'Convivencia'];

    /** Días antes del vencimiento en que se habilita la carga de un control. */
    public const OPENS_DAYS_BEFORE = 7;

    // Las fotos muestran el hogar del adoptante y los certificados son documentos médicos: disco privado.
    private const DISK = 'local';

    /** Semanal durante el primer mes y mensual hasta los seis meses: 9 controles. */
    public function dueDates(Carbon $adoptedOn): array
    {
        $dates = array_map(fn ($week) => $adoptedOn->copy()->addWeeks($week), [1, 2, 3, 4]);
        foreach ([2, 3, 4, 5, 6] as $month) {
            $dates[] = $adoptedOn->copy()->addMonthsNoOverflow($month);
        }

        return $dates;
    }

    /** Crea el calendario si todavía no existe; también cubre adopciones anteriores a esta función. */
    public function schedule(Adoption $adoption): void
    {
        if (FollowUpCheckin::where('adoption_id', $adoption->id)->exists()) {
            return;
        }
        foreach ($this->dueDates(Carbon::parse($adoption->adoption_date)->startOfDay()) as $i => $date) {
            $checkin = new FollowUpCheckin(['sequence' => $i + 1, 'due_date' => $date->toDateString()]);
            $checkin->adoption_id = $adoption->id;
            $checkin->save();
        }
    }

    public function isOpen(FollowUpCheckin $checkin): bool
    {
        return ! $checkin->submitted_at && today()->gte($checkin->due_date->copy()->subDays(self::OPENS_DAYS_BEFORE));
    }

    /** @param  array<string, UploadedFile>  $photos  Una foto por categoría. */
    public function submit(FollowUpCheckin $checkin, array $photos, ?string $comment): void
    {
        $stored = [];
        try {
            foreach (self::CATEGORIES as $category) {
                $stored[$category] = $this->store($photos[$category], 'follow-ups/'.$checkin->adoption_id);
            }
            DB::transaction(function () use ($checkin, $stored, $comment) {
                $locked = FollowUpCheckin::lockForUpdate()->findOrFail($checkin->id);
                if (! $this->isOpen($locked)) {
                    throw ValidationException::withMessages(['photos' => 'Este control ya fue enviado o todavía no está habilitado.']);
                }
                foreach ($stored as $category => $path) {
                    $locked->photos()->create(['category' => $category, 'file_path' => $path]);
                }
                $locked->comment = $comment;
                $locked->submitted_at = now();
                $locked->save();
            });
        } catch (\Throwable $error) {
            Storage::disk(self::DISK)->delete(array_values($stored));
            throw $error;
        }
    }

    public function review(FollowUpCheckin $checkin, User $reviewer, ?string $note): void
    {
        if (! $checkin->submitted_at) {
            throw ValidationException::withMessages(['shelter_note' => 'El adoptante todavía no envió este control.']);
        }
        $checkin->reviewed_at = now();
        $checkin->reviewed_by = $reviewer->id;
        $checkin->shelter_note = $note;
        $checkin->save();
    }

    public function addCertificate(Adoption $adoption, User $uploader, array $data, UploadedFile $file): VaccinationCertificate
    {
        $path = $this->store($file, 'vaccination-certificates/'.$adoption->id);
        try {
            $certificate = new VaccinationCertificate(['vaccine_name' => $data['vaccine_name'], 'application_date' => $data['application_date'], 'notes' => $data['notes'] ?? null, 'file_path' => $path]);
            $certificate->adoption_id = $adoption->id;
            $certificate->uploaded_by = $uploader->id;
            $certificate->save();

            return $certificate;
        } catch (\Throwable $error) {
            Storage::disk(self::DISK)->delete($path);
            throw $error;
        }
    }

    public function reviewCertificate(VaccinationCertificate $certificate, User $reviewer): void
    {
        $certificate->reviewed_at = now();
        $certificate->reviewed_by = $reviewer->id;
        $certificate->save();
    }

    public function response(string $path)
    {
        abort_unless(Storage::disk(self::DISK)->exists($path), 404);

        return Storage::disk(self::DISK)->response($path, null, ['Cache-Control' => 'private, max-age=0, no-store']);
    }

    private function store(UploadedFile $file, string $folder): string
    {
        $path = Storage::disk(self::DISK)->putFile($folder, $file);
        if (! $path) {
            throw ValidationException::withMessages(['photos' => 'No se pudo guardar el archivo. Intentá nuevamente.']);
        }

        return $path;
    }
}
