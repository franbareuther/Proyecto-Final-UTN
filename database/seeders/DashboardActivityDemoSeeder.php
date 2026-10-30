<?php

namespace Database\Seeders;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use App\Services\AdoptionService;
use App\Services\HealthService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DashboardActivityDemoSeeder extends Seeder
{
    private const ADOPTERS = [
        ['name' => 'Valentina', 'last_name' => 'Ríos', 'email' => 'valentina.rios@huella.test'],
        ['name' => 'Martín', 'last_name' => 'Acosta', 'email' => 'martin.acosta@huella.test'],
        ['name' => 'Camila', 'last_name' => 'Pereyra', 'email' => 'camila.pereyra@huella.test'],
        ['name' => 'Julián', 'last_name' => 'Sosa', 'email' => 'julian.sosa@huella.test'],
    ];

    // Cada ficha recorre un circuito completo: adopción en un mes anterior, aprobación, revisión, solicitud nueva o solo cuidados.
    private const ANIMALS = [
        ['name' => 'Ciro', 'species' => 'Perro', 'sex' => 'Macho', 'size' => 'Grande', 'flow' => 'adopted', 'months' => 5],
        ['name' => 'Kiara', 'species' => 'Gato', 'sex' => 'Hembra', 'size' => 'Pequeño', 'flow' => 'adopted', 'months' => 3],
        ['name' => 'Paco', 'species' => 'Perro', 'sex' => 'Macho', 'size' => 'Mediano', 'flow' => 'adopted', 'months' => 2],
        ['name' => 'Greta', 'species' => 'Perro', 'sex' => 'Hembra', 'size' => 'Mediano', 'flow' => 'adopted', 'months' => 1],
        ['name' => 'Tomate', 'species' => 'Gato', 'sex' => 'Macho', 'size' => 'Pequeño', 'flow' => 'adopted', 'months' => 0],
        ['name' => 'Uma', 'species' => 'Perro', 'sex' => 'Hembra', 'size' => 'Grande', 'flow' => 'approved'],
        ['name' => 'Zeus', 'species' => 'Perro', 'sex' => 'Macho', 'size' => 'Grande', 'flow' => 'review'],
        ['name' => 'Malena', 'species' => 'Gato', 'sex' => 'Hembra', 'size' => 'Pequeño', 'flow' => 'new'],
        ['name' => 'Ramón', 'species' => 'Perro', 'sex' => 'Macho', 'size' => 'Mediano', 'flow' => 'care'],
    ];

    private const IMAGES = [
        'Perro' => ['perro', 'perro-2', 'companero', 'perro-3', 'perro-4', 'perro-5', 'perro-6', 'perro-7', 'perro-8', 'perro-9'],
        'Gato' => ['gato', 'gato-2', 'gato-3', 'gato-4', 'gato-5'],
    ];

    private Carbon $today;

    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('La actividad demo del panel solo se permite en local/testing.');
        }
        $this->today = today();
        $adopters = array_map(fn (array $a) => $this->user($a, 'adoptante', null), self::ADOPTERS);

        foreach (Shelter::where('active', true)->orderBy('id')->get()->values() as $s => $shelter) {
            $admin = User::where('role', 'admin')->where('shelter_id', $shelter->id)->orderBy('id')->first()
                ?? $this->user(['name' => 'Equipo', 'last_name' => $shelter->name, 'email' => 'equipo.'.$shelter->slug.'@huella.test'], 'admin', $shelter->id);
            $used = ['Perro' => 0, 'Gato' => 0];
            foreach (self::ANIMALS as $i => $spec) {
                $image = self::IMAGES[$spec['species']][($used[$spec['species']]++ + $s * 3) % count(self::IMAGES[$spec['species']])];
                // Las fichas existentes, incluso archivadas, no se duplican ni se modifican.
                if (Animal::withTrashed()->where('shelter_id', $shelter->id)->where('name', $spec['name'])->exists()) {
                    continue;
                }
                try {
                    DB::transaction(fn () => $this->flow($shelter, $admin, $adopters, $spec, $image, $i));
                } finally {
                    Carbon::setTestNow();
                }
            }
        }
    }

    private function user(array $attributes, string $role, ?int $shelterId): User
    {
        $user = User::firstOrNew(['email' => $attributes['email']]);
        if (! $user->exists) {
            // Contraseña aleatoria: son cuentas de muestra, no credenciales para ingresar.
            $user->fill($attributes + ['password' => Hash::make(Str::random(40))]);
            $user->role = $role;
            $user->shelter_id = $shelterId;
            $user->save();
        }

        return $user;
    }

    private function flow(Shelter $shelter, User $admin, array $adopters, array $spec, string $image, int $i): void
    {
        $s = app(AdoptionService::class);
        $adoptedOn = $spec['flow'] === 'adopted'
            ? $this->today->copy()->startOfMonth()->subMonthsNoOverflow($spec['months'])->addDays(9)->min($this->today)
            : null;
        $start = ($adoptedOn ?? $this->today)->copy()->subDays(14);
        $this->at($start->copy()->subDays(20 + $i));
        $animal = Animal::create([
            'shelter_id' => $shelter->id, 'name' => $spec['name'], 'species' => $spec['species'], 'breed' => 'Mestizo',
            'sex' => $spec['sex'], 'estimated_age' => [6, 18, 36, 60][$i % 4], 'size' => $spec['size'],
            'color' => ['Atigrado', 'Negro', 'Blanco y marrón', 'Gris'][$i % 4],
            'description' => '[DEMOSTRACIÓN] '.$spec['name'].' forma parte de la actividad de muestra del refugio. Sus datos son ficticios y sirven para recorrer solicitudes, adopciones y cuidados.',
            'personality' => ['Tranquilo y afectuoso.', 'Juguetón y curioso.', 'Sociable con personas y otros animales.'][$i % 3],
            'entry_date' => $start->copy()->subDays(20 + $i)->toDateString(), 'availability_status' => 'Disponible',
            'public_health_info' => 'Información de demostración. Consultá al refugio sobre sus cuidados.',
        ]);
        $path = 'animals/demo-'.$animal->id.'.jpg';
        Storage::disk('public')->put($path, file_get_contents(public_path('images/demo/'.$image.'.jpg')));
        $animal->photos()->create(['file_path' => $path, 'is_primary' => true]);

        $data = fn (int $a) => ['phone' => '11 5555 02'.str_pad((string) ($a * 10 + $i), 2, '0', STR_PAD_LEFT), 'address' => 'Domicilio de demostración '.(100 + $a * 25),
            'housing_type' => $a % 2 ? 'Departamento' : 'Casa', 'has_other_pets' => $a % 2 === 1,
            'previous_experience' => 'Convivió antes con animales adoptados.', 'motivation' => 'Queremos darle un hogar responsable y permanente.'];
        $main = $adopters[$i % count($adopters)];
        $other = $adopters[($i + 1) % count($adopters)];

        match ($spec['flow']) {
            'adopted' => (function () use ($s, $admin, $animal, $data, $main, $other, $start, $adoptedOn, $i) {
                $this->at($start);
                $r = $s->submit($animal, $main, $data($i % 4));
                if ($i % 2 === 0) {
                    // Solicitud paralela: la adopción definitiva la cierra con su motivo.
                    $s->submit($animal, $other, $data(($i + 1) % 4));
                }
                $this->at($start->copy()->addDays(2));
                $s->transition($r->fresh(), $admin, 'En revisión', 'Entrevista inicial coordinada.');
                $this->at($adoptedOn->copy()->subDays(5));
                $s->transition($r->fresh(), $admin, 'Aprobada', 'Evaluación favorable del hogar.');
                $this->at($adoptedOn);
                $s->transition($r->fresh(), $admin, 'Adoptado', 'Adopción definitiva registrada.');
            })(),
            'approved' => (function () use ($s, $admin, $animal, $data, $main) {
                $this->at($this->today->copy()->subDays(12));
                $r = $s->submit($animal, $main, $data(0));
                $this->at($this->today->copy()->subDays(9));
                $s->transition($r->fresh(), $admin, 'En revisión', 'Entrevista inicial coordinada.');
                $this->at($this->today->copy()->subDays(4));
                $s->transition($r->fresh(), $admin, 'Aprobada', 'Evaluación favorable; resta coordinar la entrega.');
            })(),
            'review' => (function () use ($s, $admin, $animal, $data, $main, $other) {
                $this->at($this->today->copy()->subDays(6));
                $r = $s->submit($animal, $main, $data(1));
                $this->at($this->today->copy()->subDays(3));
                $s->transition($r->fresh(), $admin, 'En revisión', 'Visita al hogar pendiente.');
                $this->at($this->today->copy()->subDay());
                $s->submit($animal, $other, $data(2));
            })(),
            'new' => (function () use ($s, $admin, $animal, $data, $main, $other) {
                $this->at($this->today->copy()->subDays(8));
                $r = $s->submit($animal, $other, $data(3));
                $this->at($this->today->copy()->subDays(5));
                $s->transition($r->fresh(), $admin, 'Rechazada', 'El hogar no se ajusta a las necesidades del animal.');
                $this->at($this->today->copy()->subDays(2));
                $s->submit($animal, $main, $data(0));
            })(),
            'care' => null,
        };

        if ($spec['flow'] !== 'adopted') {
            $this->care($animal, $admin, $spec['flow'], $i);
        }
    }

    private function care(Animal $animal, User $admin, string $flow, int $i): void
    {
        $this->at($this->today);
        $h = app(HealthService::class);
        $note = ['observations' => '[DEMOSTRACIÓN] Registro de muestra.'];
        $h->save($animal, $admin, 'consultations', $note + ['consultation_date' => $this->today->copy()->subDays(15 + $i)->toDateString(), 'reason' => 'Control de ingreso',
            'symptoms' => 'Sin síntomas referidos', 'diagnosis' => 'Buen estado general', 'instructions' => 'Seguimiento por profesional.']);
        $h->save($animal, $admin, 'controls', $note + ['control_type' => ['Control general', 'Control de peso', 'Revisión dental', 'Control posquirúrgico'][$i % 4],
            'scheduled_date' => $this->today->copy()->addDays(3 + ($i % 4) * 6)->toDateString(), 'status' => 'Pendiente']);
        if ($flow !== 'new') {
            $h->save($animal, $admin, 'treatments', $note + ['description' => ['Antiparasitario interno', 'Tratamiento dermatológico', 'Antibiótico por herida leve'][$i % 3],
                'start_date' => $this->today->copy()->subDays(4)->toDateString(), 'estimated_end_date' => $this->today->copy()->addDays(10)->toDateString(), 'status' => 'Activo']);
        }
        if ($flow !== 'approved') {
            $h->save($animal, $admin, 'vaccinations', $note + ['vaccine_name' => $animal->species === 'Gato' ? 'Triple felina' : 'Séxtuple canina', 'dose' => 'Primera',
                'application_date' => $this->today->copy()->subDays(21)->toDateString(), 'next_dose_date' => $this->today->copy()->addDays(5 + $i)->toDateString()]);
        }
    }

    private function at(Carbon $date): void
    {
        Carbon::setTestNow($date->copy()->setTime(10, 0));
    }
}
