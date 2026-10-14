<?php

namespace Database\Seeders;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use App\Services\AdoptionService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('Los datos demo solo se permiten en local/testing.');
        }
        $password = config('shelter.demo_password');
        if (! $password || strlen($password) < 12) {
            throw new \RuntimeException('Configurá DEMO_PASSWORD con al menos 12 caracteres en .env.');
        }
        if (User::where('email', 'admin@huella.test')->exists()) {
            $this->command?->info('La demostración ya existe; no se duplicaron datos.');

            return;
        }
        DB::transaction(function () use ($password) {
            $users = [];
            foreach (['admin', 'veterinario', 'adoptante'] as $role) {
                $u = new User(['name' => ucfirst($role), 'last_name' => 'Demostración', 'email' => $role.'@huella.test', 'password' => Hash::make($password)]);
                $u->role = $role;
                $u->shelter_id = $role === 'adoptante' ? null : Shelter::where('slug', 'huella-inicial')->value('id');
                $u->save();
                $users[$role] = $u;
            }
            $animals = [];
            foreach (['Mora', 'Simón', 'Luna', 'Coco', 'Nina', 'Toto', 'Oliva', 'Félix', 'Alma', 'Rocco', 'Milo', 'Frida', 'Pipa', 'Bruno'] as $i => $name) {
                $animals[] = Animal::create([
                    'shelter_id' => Shelter::where('slug', 'huella-inicial')->value('id'),
                    'name' => $name, 'species' => $i % 3 === 0 ? 'Gato' : 'Perro', 'breed' => 'Mestizo', 'sex' => $i % 2 ? 'Macho' : 'Hembra',
                    'estimated_age' => [8, 24, 48, 100][$i % 4], 'size' => ['Pequeño', 'Mediano', 'Grande'][$i % 3],
                    'color' => ['Marrón', 'Negro y blanco', 'Dorado'][$i % 3],
                    'description' => '[DEMOSTRACIÓN] '.$name.' está esperando una familia. Disfruta de la compañía y necesita un hogar que respete sus tiempos y cuidados.',
                    'personality' => 'Cariñoso, curioso y con ganas de compartir paseos y siestas.',
                    'entry_date' => today()->subDays(20 + $i), 'availability_status' => 'Disponible',
                    'public_health_info' => 'Seguimiento sanitario al día. Consultá al refugio sobre sus cuidados específicos.',
                ]);
                $animal = end($animals);
                $image = $animal->species === 'Gato' ? 'gato' : ($i % 2 ? 'perro' : 'companero');
                $path = 'animals/demo-'.$animal->id.'.jpg';
                Storage::disk('public')->put($path, file_get_contents(public_path('images/demo/'.$image.'.jpg')));
                $animal->photos()->create(['file_path' => $path, 'is_primary' => true]);
            }
            $s = app(AdoptionService::class);
            $data = ['phone' => '11 5555 0100', 'address' => 'Domicilio de demostración 123', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Experiencia de demostración con animales.', 'motivation' => 'Quiero dar un hogar responsable y permanente a un animal del refugio.'];
            foreach (['Nueva', 'En revisión', 'Aprobada', 'Rechazada', 'Adoptado'] as $i => $status) {
                $r = $s->submit($animals[$i], $users['adoptante'], $data);
                if ($status === 'Adoptado') {
                    $s->transition($r, $users['admin'], 'Aprobada', 'Evaluación favorable de demostración.');
                }
                if ($status !== 'Nueva') {
                    $s->transition($r->fresh(), $users['admin'], $status, 'Registro de demostración para la presentación universitaria.');
                }
            }
            $animals[5]->update(['availability_status' => 'No disponible temporalmente']);
            foreach (array_slice($animals, 0, 5) as $i => $animal) {
                $vet = ['veterinarian_id' => $users['veterinario']->id, 'observations' => '[DEMOSTRACIÓN] Registro académico.'];
                $animal->consultations()->create($vet + ['consultation_date' => today()->subDays(10), 'reason' => 'Control de ingreso', 'symptoms' => 'Sin síntomas referidos', 'diagnosis' => 'Evaluación clínica de demostración', 'instructions' => 'Seguimiento por profesional.']);
                $animal->vaccinations()->create($vet + ['vaccine_name' => 'Vacuna de demostración', 'application_date' => today()->subMonths(11), 'dose' => 'Primera', 'next_dose_date' => today()->addDays(10 + $i)]);
                $animal->treatments()->create($vet + ['description' => 'Tratamiento de demostración indicado por profesional', 'start_date' => today()->subDays(3), 'estimated_end_date' => today()->addDays(10), 'status' => $i % 2 ? 'Finalizado' : 'Activo']);
                $animal->controls()->create($vet + ['control_type' => 'Control general', 'scheduled_date' => today()->addDays($i * 4 - 2), 'status' => 'Pendiente']);
            }
        });
    }
}
