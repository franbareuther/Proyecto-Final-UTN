<?php

namespace Database\Seeders;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use App\Services\HealthService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

/**
 * Seis refugios ficticios con diez animales cada uno, fotografías reales con licencia libre
 * (public/images/demo/red) e historias clínicas de demostración. No modifica registros existentes
 * y se puede ejecutar varias veces sin duplicar datos.
 */
class NetworkSheltersDemoSeeder extends Seeder
{
    private const PHOTOS = 'images/demo/red';

    private const STORAGE = 'network-demo';

    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('Los refugios demo solo se permiten en local/testing.');
        }
        $password = config('shelter.demo_password');
        if (! $password || strlen($password) < 12) {
            throw new \RuntimeException('Configurá DEMO_PASSWORD con al menos 12 caracteres en .env.');
        }
        $shelters = require database_path('seeders/data/network-shelters.php');

        // Se preparan todas las fotos antes de escribir en la base: si falta una, no se carga nada.
        $keys = [];
        foreach ($shelters as $shelter) {
            $keys[] = $shelter['image'];
            foreach ($shelter['animals'] as $animal) {
                array_push($keys, ...$animal['photos']);
            }
        }
        foreach (array_unique($keys) as $key) {
            $source = public_path(self::PHOTOS.'/'.$key.'.jpg');
            if (! is_file($source)) {
                throw new \RuntimeException('Falta la fotografía de demostración: '.$key);
            }
            if (! Storage::disk('public')->exists(self::STORAGE.'/'.$key.'.jpg')) {
                Storage::disk('public')->put(self::STORAGE.'/'.$key.'.jpg', file_get_contents($source));
            }
        }

        foreach ($shelters as $data) {
            DB::transaction(fn () => $this->shelter($data, $password));
        }
    }

    private function shelter(array $data, string $password): void
    {
        $shelter = Shelter::firstOrCreate(['slug' => $data['slug']], [
            'name' => $data['name'], 'city' => $data['city'], 'address' => $data['address'],
            'phone' => $data['phone'], 'email' => $data['email'], 'active' => true, 'image_type' => 'photo',
            'description' => $data['description']."\n\nHorarios de visita: ".$data['hours'].'.'
                ."\n\nRefugio ficticio: nombre, contacto y fichas son datos de muestra. La fotografía es ilustrativa y no corresponde a esta institución.",
        ]);
        if ($shelter->wasRecentlyCreated) {
            $shelter->image_path = self::STORAGE.'/'.$data['image'].'.jpg';
            $shelter->save();
        }
        $admin = User::firstOrNew(['email' => 'equipo.'.$data['slug'].'@huella.test']);
        if (! $admin->exists) {
            $admin->fill(['name' => $data['admin'][0], 'last_name' => $data['admin'][1], 'password' => Hash::make($password)]);
            $admin->role = 'admin';
            $admin->shelter_id = $shelter->id;
            $admin->save();
        }
        foreach ($data['animals'] as $spec) {
            // Las fichas existentes, incluso archivadas, no se duplican ni se modifican.
            if (Animal::withTrashed()->where('shelter_id', $shelter->id)->where('name', $spec['name'])->exists()) {
                continue;
            }
            $this->animal($shelter, $admin, $spec);
        }
    }

    private function animal(Shelter $shelter, User $admin, array $a): void
    {
        $h = $a['health'];
        $entry = today()->subDays($a['entered']);
        $animal = Animal::create([
            'shelter_id' => $shelter->id, 'name' => $a['name'], 'species' => $a['species'], 'breed' => $a['breed'],
            'sex' => $a['sex'], 'birth_date' => $a['birth'] ?? null, 'estimated_age' => $a['age'],
            'size' => $a['size'], 'color' => $a['color'], 'entry_date' => $entry->toDateString(),
            'availability_status' => $a['status'] ?? 'Disponible',
            'description' => $a['story'].' '.$a['looks'].' Pesa alrededor de '.str_replace('.', ',', (string) $a['weight']).' kg.'
                ."\n\nFicha de demostración: el nombre y la historia son ficticios y la fotografía es ilustrativa.",
            'personality' => $a['personality']."\n\n".$this->compatibility($a['compat']),
            'public_health_info' => $this->publicHealth($a['species'], $a['sex'], $h),
        ]);
        foreach ($a['photos'] as $i => $key) {
            $animal->photos()->create(['file_path' => self::STORAGE.'/'.$key.'.jpg', 'is_primary' => $i === 0]);
        }
        foreach ($this->clinicalRecords($a, $entry) as [$type, $record]) {
            app(HealthService::class)->save($animal, $admin, $type, $record + ['observations' => 'Registro clínico ficticio, no corresponde a un animal real.']);
        }
    }

    private function compatibility(array $c): string
    {
        $say = fn ($value, string $who) => match ($value) {
            true => "se lleva bien con $who",
            false => "prefiere un hogar sin $who",
            default => "con $who: $value",
        };

        return 'Convivencia: '.$say($c['kids'], 'chicos').'; '.$say($c['dogs'], 'perros').'; '.$say($c['cats'], 'gatos').'.';
    }

    private function publicHealth(string $species, string $sex, array $h): string
    {
        $parts = [$h['vaccinated'] ? 'Vacunas al día' : 'Plan de vacunación en curso', 'desparasitado'.($sex === 'Hembra' ? 'a' : '')];
        $parts[] = isset($h['neutered'])
            ? ($sex === 'Hembra' ? 'castrada' : 'castrado')
            : 'castración pendiente (se coordina con la adopción)';
        $text = ucfirst(implode(', ', $parts)).'.';
        if (! empty($h['note'])) {
            $text .= ' '.$h['note'];
        }

        return $text.' Información de demostración.';
    }

    /** Arma la historia clínica a partir del perfil sanitario de cada ficha. Las fechas son relativas a hoy. */
    private function clinicalRecords(array $a, $entry): array
    {
        $h = $a['health'];
        $day = fn (int $offset) => $entry->copy()->addDays($offset)->min(today())->toDateString();
        $records = [['consultations', ['consultation_date' => $day(1), 'reason' => 'Control de ingreso', 'symptoms' => $h['intake'] ?? 'Sin síntomas referidos',
            'diagnosis' => $h['diagnosis'] ?? 'Buen estado general. Peso y condición corporal adecuados.', 'instructions' => 'Plan de vacunación y desparasitación de rutina.']]];
        $records[] = ['treatments', ['treatment_type' => 'Desparasitación', 'description' => 'Desparasitación interna y externa de ingreso.',
            'medication' => $a['species'] === 'Gato' ? 'Antiparasitario felino en pipeta y comprimido' : 'Antiparasitario interno según peso y pipeta externa',
            'start_date' => $day(2), 'estimated_end_date' => $day(2), 'status' => 'Finalizado']];
        $vaccine = $a['species'] === 'Gato' ? 'Triple felina' : 'Séxtuple canina';
        $nextDose = $h['vaccinated'] ? null : today()->addDays($h['next_dose'] ?? 14)->toDateString();
        $records[] = ['vaccinations', ['vaccine_name' => $vaccine, 'application_date' => $day(7), 'dose' => $h['vaccinated'] ? 'Refuerzo' : 'Primera dosis', 'next_dose_date' => $nextDose]];
        if ($h['vaccinated'] && $a['age'] >= 6) {
            $records[] = ['vaccinations', ['vaccine_name' => 'Antirrábica', 'application_date' => $day(9), 'dose' => 'Anual', 'next_dose_date' => null]];
        }
        if (isset($h['neutered'])) {
            $records[] = ['consultations', ['consultation_date' => $day($h['neutered']), 'reason' => $a['sex'] === 'Hembra' ? 'Castración (ovariohisterectomía)' : 'Castración (orquiectomía)',
                'symptoms' => 'Cirugía programada', 'diagnosis' => 'Cirugía sin complicaciones. Alta en el día.', 'instructions' => 'Collar isabelino y reposo por diez días. Control de puntos.']];
        }
        foreach ($h['treatments'] ?? [] as $t) {
            // Un tratamiento activo termina después de hoy; uno finalizado, entre el ingreso y hoy.
            $end = $t['status'] === 'Activo' ? today()->addDays($t['until'] ?? 10)->toDateString() : $day($t['end'] ?? $t['start'] + 10);
            $records[] = ['treatments', ['treatment_type' => $t['type'] ?? 'Tratamiento', 'description' => $t['description'], 'medication' => $t['medication'] ?? null,
                'start_date' => $t['status'] === 'Activo' ? today()->subDays($t['since'] ?? 5)->toDateString() : $day($t['start']),
                'estimated_end_date' => $end, 'status' => $t['status']]];
        }
        foreach ($h['controls'] ?? [] as $c) {
            $records[] = ['controls', ['control_type' => $c['type'], 'scheduled_date' => today()->addDays($c['in'])->toDateString(), 'status' => $c['status'] ?? 'Pendiente']];
        }

        return $records;
    }
}
