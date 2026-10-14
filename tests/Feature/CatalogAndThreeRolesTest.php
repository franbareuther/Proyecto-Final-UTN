<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CatalogAndThreeRolesTest extends TestCase
{
    use RefreshDatabase;

    public function test_global_catalog_filters_by_city_refuge_and_species_without_inactive_records(): void
    {
        $sur = Shelter::create(['name' => 'Sur', 'slug' => 'sur', 'city' => 'Rosario', 'active' => true]);
        $norte = Shelter::create(['name' => 'Norte', 'slug' => 'norte', 'city' => 'Córdoba', 'active' => true]);
        $hidden = Shelter::create(['name' => 'Inactivo', 'slug' => 'inactivo', 'city' => 'Rosario', 'active' => false]);
        Animal::factory()->count(14)->create(['shelter_id' => $sur->id, 'species' => 'Gato']);
        $other = Animal::factory()->create(['shelter_id' => $norte->id, 'species' => 'Perro']);
        Animal::factory()->create(['shelter_id' => $hidden->id]);
        $this->get('/animales')->assertInertia(fn (Assert $p) => $p->where('animals.total', 15)->where('shelter', null)->has('refuges', 3));
        $this->get('/animales?city=Rosario&species=Gato')->assertInertia(fn (Assert $p) => $p->where('animals.total', 14)->where('animals.next_page_url', url('/animales?city=Rosario&species=Gato&page=2')));
        $this->get('/animales?shelter=norte')->assertInertia(fn (Assert $p) => $p->has('animals.data', 1)->where('animals.data.0.id', $other->id)->where('animals.data.0.shelter.name', 'Norte'));
        $this->followingRedirects()->get('/refugios/sur/animales?shelter=norte&city=Córdoba')->assertInertia(fn (Assert $p) => $p->where('animals.total', 14));
        $this->actingAs(User::factory()->create(['role' => 'admin', 'shelter_id' => $sur->id]));
        $this->get('/animales')->assertInertia(fn (Assert $p) => $p->where('animals.total', 15));
        $this->get('/refugios/norte/animales/'.$other->id)->assertOk();
        $this->get('/veterinaria/'.$other->id)->assertNotFound();
    }

    public function test_only_refuge_admin_records_health_and_preserves_author_and_professional(): void
    {
        $animal = Animal::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $payload = ['consultation_date' => today()->toDateString(), 'reason' => 'Ingreso', 'diagnosis' => 'Informe del profesional', 'practitioner_name' => 'Dra. Ana Pérez', 'recorded_by' => 999, 'updated_by' => 999];
        foreach (['adoptante', 'superadmin', 'veterinario'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))->post('/veterinaria/'.$animal->id.'/consultations', $payload)->assertForbidden();
        }
        $this->actingAs($admin)->post('/veterinaria/'.$animal->id.'/consultations', $payload)->assertSessionHasNoErrors();
        $record = $animal->consultations()->firstOrFail();
        $this->assertDatabaseHas('medical_consultations', ['id' => $record->id, 'recorded_by' => $admin->id, 'practitioner_name' => 'Dra. Ana Pérez', 'updated_by' => null]);
        $this->patch('/veterinaria/'.$animal->id.'/consultations/'.$record->id, $payload + ['observations' => 'Documento actualizado'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('medical_consultations', ['id' => $record->id, 'recorded_by' => $admin->id, 'updated_by' => $admin->id]);
        $colleague = User::factory()->create(['role' => 'admin']);
        $this->actingAs($colleague)->patch('/veterinaria/'.$animal->id.'/consultations/'.$record->id, $payload)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('medical_consultations', ['id' => $record->id, 'recorded_by' => $admin->id, 'updated_by' => $colleague->id]);
    }

    public function test_superadmin_cannot_create_a_veterinarian_role(): void
    {
        $shelter = Shelter::where('slug', 'huella-inicial')->firstOrFail();
        $this->actingAs(User::factory()->create(['role' => 'superadmin']))->post('/superadmin/refugios/'.$shelter->slug.'/personal', ['name' => 'Persona', 'last_name' => 'Prueba', 'email' => 'staff@example.test', 'role' => 'veterinario', 'password' => 'password-test-123', 'password_confirmation' => 'password-test-123'])->assertSessionHasErrors('role');
        $this->assertDatabaseMissing('users', ['email' => 'staff@example.test']);
    }
}
