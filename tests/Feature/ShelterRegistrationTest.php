<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use App\Services\AdoptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ShelterRegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return $overrides + [
            'shelter_name' => 'Patitas del Sur', 'city' => 'Quilmes', 'address' => 'Calle 123', 'phone' => '11 5555 0000',
            'description' => 'Refugio comunitario que acompaña a perros y gatos hasta encontrar familia.',
            'name' => 'Ana', 'last_name' => 'Gómez', 'email' => 'Ana@Refugio.test',
            'password' => 'una-clave-segura', 'password_confirmation' => 'una-clave-segura',
            'website' => 'https://patitas.test', 'instagram' => 'https://instagram.com/patitas', 'facebook' => '',
        ];
    }

    public function test_guest_registers_a_shelter_and_lands_on_its_own_dashboard(): void
    {
        $this->get('/registro-refugio')->assertInertia(fn (Assert $page) => $page->component('Auth/RegisterShelter'));

        $this->post('/registro-refugio', $this->payload())->assertRedirect('/admin')->assertSessionHas('success');

        $shelter = Shelter::where('slug', 'patitas-del-sur')->firstOrFail();
        $user = User::where('email', 'ana@refugio.test')->firstOrFail();
        $this->assertTrue($shelter->active);
        $this->assertSame(['Quilmes', '11 5555 0000', 'ana@refugio.test', 'https://instagram.com/patitas', null], [$shelter->city, $shelter->phone, $shelter->email, $shelter->instagram, $shelter->facebook]);
        $this->assertSame(['admin', $shelter->id], [$user->role, $user->shelter_id]);
        $this->assertAuthenticatedAs($user);
        $this->get('/admin')->assertInertia(fn (Assert $page) => $page->where('shelter.name', 'Patitas del Sur')->where('stats.Animales registrados', 0));
        $this->get('/admin/refugio')->assertOk();
        $this->get('/refugios/patitas-del-sur')->assertInertia(fn (Assert $page) => $page->where('shelter.website', 'https://patitas.test'));
    }

    public function test_role_and_shelter_cannot_be_injected_and_slug_stays_unique(): void
    {
        Shelter::create(['name' => 'Patitas del Sur', 'slug' => 'patitas-del-sur', 'active' => true]);
        $other = Shelter::create(['name' => 'Otro', 'slug' => 'otro', 'active' => true]);

        $this->post('/registro-refugio', $this->payload(['role' => 'superadmin', 'shelter_id' => $other->id, 'slug' => 'otro', 'active' => false]))->assertRedirect('/admin');

        $user = User::where('email', 'ana@refugio.test')->firstOrFail();
        $this->assertSame('admin', $user->role);
        $this->assertSame('patitas-del-sur-2', $user->shelter->slug);
        $this->assertTrue($user->shelter->active);
    }

    public function test_invalid_data_is_rejected_without_creating_anything(): void
    {
        User::factory()->create(['email' => 'usada@refugio.test']);
        $shelters = Shelter::count();

        $this->post('/registro-refugio', $this->payload([
            'shelter_name' => '', 'phone' => '', 'city' => '', 'description' => 'Corta',
            'email' => 'usada@refugio.test', 'password_confirmation' => 'distinta-clave',
            'website' => 'javascript:alert(1)',
        ]))->assertSessionHasErrors(['shelter_name', 'phone', 'city', 'description', 'email', 'password', 'website']);

        $this->assertSame($shelters, Shelter::count());
        $this->assertGuest();
    }

    public function test_image_is_validated_and_stored(): void
    {
        Storage::fake('public');

        $this->post('/registro-refugio', $this->payload(['image' => UploadedFile::fake()->create('logo.svg', 10, 'image/svg+xml')]))->assertSessionHasErrors('image');
        $this->assertDatabaseMissing('shelters', ['slug' => 'patitas-del-sur']);

        $this->post('/registro-refugio', $this->payload(['image' => UploadedFile::fake()->image('logo.png', 400, 400), 'image_type' => 'logo']))->assertRedirect('/admin');
        $shelter = Shelter::where('slug', 'patitas-del-sur')->firstOrFail();
        $this->assertSame('logo', $shelter->image_type);
        Storage::disk('public')->assertExists($shelter->image_path);
    }

    public function test_signed_in_users_cannot_open_the_registration(): void
    {
        $this->actingAs(User::factory()->create())->get('/registro-refugio')->assertRedirect();
    }

    public function test_registered_shelter_only_manages_its_own_data(): void
    {
        // Los datos ajenos se crean antes de iniciar sesión: con la sesión del refugio nuevo, el alcance por refugio ya los oculta.
        $foreign = Animal::factory()->create(['shelter_id' => Shelter::where('slug', 'huella-inicial')->value('id')]);
        $adopter = User::factory()->create(['role' => 'adoptante']);
        $request = app(AdoptionService::class)->submit($foreign, $adopter, ['phone' => '1155551234', 'address' => 'Calle 123', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Experiencia previa.', 'motivation' => 'Un hogar responsable y permanente.']);
        $this->post('/registro-refugio', $this->payload())->assertRedirect('/admin');
        $admin = User::where('email', 'ana@refugio.test')->firstOrFail();
        $mine = Animal::factory()->create(['shelter_id' => $admin->shelter_id]);
        $this->get('/admin/animales/'.$mine->id.'/edit')->assertOk();
        $this->assertContains($this->get('/admin/animales/'.$foreign->id.'/edit')->status(), [403, 404]);
        $this->assertContains($this->get('/veterinaria/'.$foreign->id)->status(), [403, 404]);
        $this->assertContains($this->patch('/admin/solicitudes/'.$request->id, ['status' => 'Rechazada', 'observations' => 'Intento ajeno.'])->status(), [403, 404]);
        $this->assertSame('Nueva', $request->fresh()->status);
        $this->get('/admin')->assertInertia(fn (Assert $page) => $page->where('stats.Animales registrados', 1)->where('stats.Solicitudes pendientes', 0));
    }

    public function test_each_admin_is_welcomed_with_its_own_shelter_name(): void
    {
        foreach (['Refugio Norte' => 'norte', 'Refugio Sur' => 'sur'] as $name => $slug) {
            $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => Shelter::create(['name' => $name, 'slug' => $slug, 'active' => true])->id]);
            $this->actingAs($admin)->get('/admin')->assertInertia(fn (Assert $page) => $page->where('shelter.name', $name)->where('shelter.slug', $slug));
        }
    }

    public function test_treatments_record_deworming_and_medication(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => Shelter::where('slug', 'huella-inicial')->value('id')]);
        $animal = Animal::factory()->create();
        $this->actingAs($admin);

        $this->post("/veterinaria/{$animal->id}/treatments", ['treatment_type' => 'Desparasitación', 'description' => 'Desparasitación interna de rutina', 'medication' => 'Antiparasitario 1 comprimido', 'start_date' => today()->toDateString(), 'status' => 'Activo'])->assertSessionHasNoErrors();
        $this->post("/veterinaria/{$animal->id}/treatments", ['treatment_type' => 'Cirugía', 'description' => 'Tipo inválido', 'start_date' => today()->toDateString(), 'status' => 'Activo'])->assertSessionHasErrors('treatment_type');
        $this->post("/veterinaria/{$animal->id}/treatments", ['description' => 'Sin tipo explícito', 'start_date' => today()->toDateString(), 'status' => 'Activo'])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('treatments', ['animal_id' => $animal->id, 'treatment_type' => 'Desparasitación', 'medication' => 'Antiparasitario 1 comprimido']);
        $this->assertDatabaseHas('treatments', ['animal_id' => $animal->id, 'description' => 'Sin tipo explícito', 'treatment_type' => 'Tratamiento']);
        $this->assertDatabaseCount('treatments', 2);
    }
}
