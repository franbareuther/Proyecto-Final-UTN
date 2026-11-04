<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use Database\Seeders\NetworkSheltersDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NetworkSheltersDemoTest extends TestCase
{
    use RefreshDatabase;

    private const SLUGS = ['cola-inquieta', 'el-jacaranda', 'isla-delta', 'cucha-del-puerto', 'rescate-ruta-7', 'gateria-villa-crespo'];

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        config(['shelter.demo_password' => 'clave-demo-segura-123']);
    }

    public function test_adds_six_complete_shelters_with_ten_animals_each_without_touching_existing_data(): void
    {
        $existing = Animal::factory()->create(['name' => 'Previo']);
        $before = $existing->fresh()->getAttributes();
        $shelters = Shelter::count();

        $this->seed(NetworkSheltersDemoSeeder::class);
        $this->seed(NetworkSheltersDemoSeeder::class);

        $this->assertSame($shelters + 6, Shelter::count());
        $this->assertSame($before, $existing->fresh()->getAttributes());
        $animals = Animal::with(['photos', 'shelter', 'consultations', 'vaccinations', 'treatments'])->whereHas('shelter', fn ($q) => $q->whereIn('slug', self::SLUGS))->get();
        $this->assertCount(60, $animals);
        foreach (self::SLUGS as $slug) {
            $shelter = Shelter::where('slug', $slug)->sole();
            $this->assertSame(10, $animals->where('shelter_id', $shelter->id)->count(), $slug);
            $this->assertTrue($shelter->active);
            $this->assertNotEmpty($shelter->description);
            $this->assertNotEmpty($shelter->phone);
            $this->assertStringEndsWith('@huella.test', $shelter->email);
            Storage::disk('public')->assertExists($shelter->image_path);
            $admin = User::where('email', "equipo.$slug@huella.test")->sole();
            $this->assertSame(['admin', $shelter->id], [$admin->role, $admin->shelter_id]);
        }

        $this->assertSame(60, $animals->pluck('description')->unique()->count(), 'Cada ficha tiene una historia propia.');
        $this->assertSame(60, $animals->map(fn ($a) => $a->shelter_id.'-'.$a->name)->unique()->count());
        $credits = collect(json_decode(file_get_contents(public_path('images/demo/red/creditos.json')), true))->keyBy('file');
        foreach ($animals as $animal) {
            foreach (['name', 'species', 'breed', 'sex', 'size', 'color', 'description', 'personality', 'entry_date', 'availability_status', 'public_health_info'] as $field) {
                $this->assertNotEmpty($animal->$field, "{$animal->name}: $field");
            }
            $this->assertNotNull($animal->estimated_age);
            $this->assertSame(1, $animal->photos->where('is_primary', true)->count(), $animal->name);
            foreach ($animal->photos as $photo) {
                Storage::disk('public')->assertExists($photo->file_path);
                $this->assertTrue($credits->has(basename($photo->file_path)), "Sin crédito: {$photo->file_path}");
            }
            $this->assertGreaterThanOrEqual(1, $animal->consultations->count());
            $this->assertGreaterThanOrEqual(1, $animal->vaccinations->count());
            $this->assertTrue($animal->treatments->contains('treatment_type', 'Desparasitación'), $animal->name);
        }
        $this->assertGreaterThan(20, $animals->where('species', 'Gato')->count());
        $this->assertGreaterThan(20, $animals->where('species', 'Perro')->count());
        $this->assertTrue($animals->contains('availability_status', 'No disponible temporalmente'));
        $this->assertTrue($animals->flatMap->treatments->contains('status', 'Activo'));
    }

    public function test_demo_shelters_show_up_publicly_and_each_admin_manages_only_its_own_animals(): void
    {
        $this->seed(NetworkSheltersDemoSeeder::class);
        $delta = Shelter::where('slug', 'isla-delta')->sole();

        $this->get('/refugios?q=Isla')->assertInertia(fn (Assert $page) => $page->where('shelters.data.0.slug', 'isla-delta'));
        $this->get('/refugios/isla-delta/animales')->assertInertia(fn (Assert $page) => $page->where('animals.total', 10));
        $this->get('/refugios/gateria-villa-crespo/animales?species=Gato')->assertInertia(fn (Assert $page) => $page->where('animals.total', 10));
        $animal = Animal::where('shelter_id', $delta->id)->where('name', 'Remo')->sole();
        $this->get("/refugios/isla-delta/animales/{$animal->id}")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('animal.name', 'Remo')->missing('animal.consultations'));
        $this->get('/creditos-fotografias')->assertInertia(fn (Assert $page) => $page->has('networkPhotos', 70)->has('photos', 9));

        // El animal ajeno se busca antes de iniciar sesión: con la sesión del refugio, el alcance ya lo oculta.
        $foreign = Animal::whereHas('shelter', fn ($q) => $q->where('slug', 'cola-inquieta'))->first();
        $this->actingAs(User::where('email', 'equipo.isla-delta@huella.test')->sole());
        $this->get('/admin')->assertInertia(fn (Assert $page) => $page->where('shelter.name', 'Refugio Isla Delta')->where('stats.Animales registrados', 10));
        $this->get("/veterinaria/{$animal->id}")->assertOk();
        $this->assertContains($this->get("/admin/animales/{$foreign->id}/edit")->status(), [403, 404]);
    }

    public function test_is_rejected_outside_local_and_testing(): void
    {
        $this->app['env'] = 'production';

        $this->expectException(\RuntimeException::class);
        app(NetworkSheltersDemoSeeder::class)->run();
    }
}
