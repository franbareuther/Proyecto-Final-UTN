<?php

namespace Database\Seeders;

use App\Models\Animal;
use App\Models\Shelter;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CommunitySheltersDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('Los refugios demo solo se permiten en local/testing.');
        }

        $refuges = [
            ['slug' => 'patitas-del-sur-demo', 'name' => 'Patitas del Sur', 'city' => 'La Plata', 'image' => 'patitas-sur', 'story' => 'Un espacio de cuidado y acompañamiento donde cada perro tiene sus tiempos. El día a día se comparte entre paseos, limpieza de los caniles y encuentros con posibles familias.', 'dogs' => [
                ['key' => 'pancho', 'name' => 'Pancho', 'sex' => 'Macho', 'age' => 36, 'size' => 'Mediano', 'color' => 'Negro, marrón y blanco', 'personality' => 'Curioso y atento. Disfruta de las salidas tranquilas y de conocer personas a su ritmo.'],
                ['key' => 'miel', 'name' => 'Miel', 'sex' => 'Macho', 'age' => 48, 'size' => 'Grande', 'color' => 'Negro y marrón', 'personality' => 'Sociable y compañero. Le gustan los paseos con tiempo para explorar.'],
            ]],
            ['slug' => 'hogar-los-aromos-demo', 'name' => 'Hogar Los Aromos', 'city' => 'Córdoba', 'image' => 'los-aromos', 'story' => 'Un hogar de paso pensado para recuperar rutinas y confianza. El equipo organiza los espacios de descanso, las salidas al patio y las visitas para conocer a los animales.', 'dogs' => [
                ['key' => 'chispita', 'name' => 'Chispita', 'sex' => 'Hembra', 'age' => 24, 'size' => 'Mediano', 'color' => 'Blanco con manchas marrones', 'personality' => 'Atenta y curiosa. Necesita presentaciones pausadas y una rutina estable.'],
                ['key' => 'tango', 'name' => 'Tango', 'sex' => 'Macho', 'age' => 30, 'size' => 'Mediano', 'color' => 'Blanco y crema', 'personality' => 'Compañero y tranquilo. Disfruta del contacto cercano y de los paseos cortos.'],
            ]],
            ['slug' => 'refugio-la-ribera-demo', 'name' => 'Refugio La Ribera', 'city' => 'Rosario', 'image' => 'la-ribera', 'story' => 'Un refugio comunitario que acompaña a perros en distintas etapas de su vida. Las jornadas combinan cuidados cotidianos, momentos de juego y el trabajo de encontrar familias responsables.', 'dogs' => [
                ['key' => 'lola', 'name' => 'Lola', 'sex' => 'Hembra', 'age' => 36, 'size' => 'Mediano', 'color' => 'Marrón', 'personality' => 'Observadora y cariñosa. Se siente cómoda con una rutina tranquila y respetuosa.'],
                ['key' => 'toby', 'name' => 'Toby', 'sex' => 'Macho', 'age' => 2, 'size' => 'Pequeño', 'color' => 'Negro y marrón', 'personality' => 'Activo y curioso. Necesita juego, acompañamiento y aprendizaje con paciencia.'],
            ]],
        ];

        // Prepare only the new demo files; existing shelter and animal photos are preserved.
        foreach ($refuges as $refuge) {
            $keys = [$refuge['image'], ...array_column($refuge['dogs'], 'key')];
            foreach ($keys as $key) {
                $source = public_path('images/demo/refugios/'.$key.'.jpg');
                if (! is_file($source)) {
                    throw new \RuntimeException('Falta la fotografía documental: '.$key);
                }
                $target = 'community-demo/'.$key.'.jpg';
                if (! Storage::disk('public')->exists($target)) {
                    Storage::disk('public')->put($target, file_get_contents($source));
                }
            }
        }

        DB::transaction(function () use ($refuges) {
            foreach ($refuges as $refuge) {
                $shelter = Shelter::firstOrCreate(['slug' => $refuge['slug']], [
                    'name' => $refuge['name'], 'city' => $refuge['city'], 'active' => true,
                    'description' => '[DEMOSTRACIÓN] '.$refuge['story'].' Nombre, ubicación y fichas ficticios. La fotografía documental es ilustrativa y no corresponde a esta institución. Créditos y procedencia en la sección de fotografías.',
                    'image_type' => 'photo',
                ]);
                if ($shelter->wasRecentlyCreated) {
                    $shelter->image_path = 'community-demo/'.$refuge['image'].'.jpg';
                    $shelter->save();
                }
                foreach ($refuge['dogs'] as $dog) {
                    $animal = Animal::firstOrCreate(['shelter_id' => $shelter->id, 'name' => $dog['name']], [
                        'species' => 'Perro', 'breed' => 'Mestizo', 'sex' => $dog['sex'],
                        'estimated_age' => $dog['age'], 'size' => $dog['size'], 'color' => $dog['color'],
                        'description' => '[DEMOSTRACIÓN] Ficha ficticia con una fotografía documental de un perro real de refugio. El nombre, la edad y los datos son de muestra; no se ofrece la adopción del animal fotografiado.',
                        'personality' => $dog['personality'], 'entry_date' => today()->subDays(30),
                        'availability_status' => 'Disponible',
                        'public_health_info' => 'Información de demostración. No representa una evaluación veterinaria del animal fotografiado.',
                    ]);
                    if ($animal->wasRecentlyCreated) {
                        $animal->photos()->create(['file_path' => 'community-demo/'.$dog['key'].'.jpg', 'is_primary' => true]);
                    }
                }
            }
        });
    }
}
