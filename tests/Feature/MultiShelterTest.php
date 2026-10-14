<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use App\Services\AdoptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class MultiShelterTest extends TestCase
{
    use RefreshDatabase;

    private function refuge(string $slug, bool $active = true): Shelter
    {
        return Shelter::create(['name' => ucfirst($slug), 'slug' => $slug, 'active' => $active]);
    }

    private function staff(Shelter $shelter, string $role = 'admin'): User
    {
        return User::factory()->create(['role' => $role, 'shelter_id' => $shelter->id]);
    }

    private function application(Animal $animal, User $user)
    {
        return app(AdoptionService::class)->submit($animal, $user, ['phone' => '1155551234', 'address' => 'Calle 123', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Experiencia previa.', 'motivation' => 'Un hogar responsable y permanente.']);
    }

    public function test_public_directory_and_catalog_are_separated(): void
    {
        $a = $this->refuge('sur');
        $b = $this->refuge('norte');
        $hidden = $this->refuge('inactivo', false);
        $animal = Animal::factory()->create(['shelter_id' => $a->id, 'breed' => 'Raza del sur']);
        Animal::factory()->create(['shelter_id' => $b->id, 'breed' => 'Raza del norte']);
        Animal::factory()->create(['shelter_id' => $hidden->id]);
        $this->get('/refugios')->assertInertia(fn (Assert $p) => $p->has('shelters.data', 3));
        $this->get('/animales')->assertInertia(fn (Assert $p) => $p->has('animals.data', 2));
        $this->get('/refugios/sur/animales')->assertInertia(fn (Assert $p) => $p->has('animals.data', 1)->where('animals.data.0.id', $animal->id)->where('breeds', ['Raza del sur']));
        $this->get('/refugios/norte/animales/'.$animal->id)->assertNotFound();
        $this->get('/refugios/inactivo')->assertNotFound();
        $this->get('/refugios/inactivo/animales')->assertNotFound();
        $this->get('/')->assertInertia(fn (Assert $p) => $p->has('animals', 2));
    }

    public function test_filters_and_pagination_keep_the_shelter(): void
    {
        $a = $this->refuge('sur');
        Animal::factory()->count(14)->create(['shelter_id' => $a->id, 'species' => 'Gato']);
        $this->get('/refugios/sur/animales?species=Gato')->assertInertia(fn (Assert $p) => $p->where('animals.total', 14)->where('shelter.slug', 'sur')->where('catalogUrl', url('/refugios/sur/animales'))->where('animals.next_page_url', url('/refugios/sur/animales?species=Gato&page=2')));
    }

    public function test_staff_cannot_access_or_modify_another_shelters_animals(): void
    {
        $a = $this->refuge('sur');
        $b = $this->refuge('norte');
        $own = Animal::factory()->create(['shelter_id' => $a->id]);
        $foreign = Animal::factory()->create(['shelter_id' => $b->id]);
        $photo = $foreign->photos()->create(['file_path' => 'animals/foreign.jpg', 'is_primary' => true]);
        $this->actingAs($this->staff($a));
        $this->get('/admin/animales')->assertInertia(fn (Assert $p) => $p->has('animals.data', 1)->where('animals.data.0.id', $own->id));
        $this->get('/admin/animales/'.$foreign->id.'/edit')->assertNotFound();
        $this->put('/admin/animales/'.$foreign->id, [])->assertNotFound();
        $this->delete('/admin/animales/'.$foreign->id)->assertNotFound();
        $this->delete('/admin/animales/'.$own->id.'/fotos/'.$photo->id)->assertNotFound();
        $this->assertDatabaseHas('animals', ['id' => $foreign->id, 'deleted_at' => null]);
    }

    public function test_animal_creation_ignores_forged_shelter(): void
    {
        $a = $this->refuge('sur');
        $b = $this->refuge('norte');
        $this->actingAs($this->staff($a));
        $data = Animal::factory()->make(['shelter_id' => $b->id, 'name' => 'Mora'])->getAttributes();
        $this->post('/admin/animales', $data)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('animals', ['name' => 'Mora', 'shelter_id' => $a->id]);
    }

    public function test_adoptions_and_dashboard_only_show_the_staff_shelter(): void
    {
        $a = $this->refuge('sur');
        $b = $this->refuge('norte');
        $adopter = User::factory()->create();
        $own = $this->application(Animal::factory()->create(['shelter_id' => $a->id]), $adopter);
        $foreign = $this->application(Animal::factory()->create(['shelter_id' => $b->id]), $adopter);
        $admin = $this->staff($a);
        $this->actingAs($admin);
        $this->get('/admin')->assertInertia(fn (Assert $p) => $p->where('stats.Animales registrados', 1)->where('stats.Solicitudes pendientes', 1));
        $this->get('/admin/solicitudes')->assertInertia(fn (Assert $p) => $p->has('requests.data', 1)->where('requests.data.0.id', $own->id));
        $this->get('/solicitudes/'.$foreign->id)->assertNotFound();
        $this->patch('/admin/solicitudes/'.$foreign->id, ['status' => 'Aprobada', 'observations' => 'Intento desde otro refugio.'])->assertNotFound();
        $this->patch('/admin/solicitudes/'.$own->id, ['status' => 'Aprobada', 'observations' => 'Decisión del refugio correcto.'])->assertSessionHasNoErrors();
        $this->patch('/admin/solicitudes/'.$own->id, ['status' => 'Adoptado', 'observations' => 'Adopción concretada.'])->assertSessionHasNoErrors();
        $this->get('/admin/adopciones')->assertInertia(fn (Assert $p) => $p->has('adoptions.data', 1));
        $this->assertDatabaseHas('adoption_requests', ['id' => $foreign->id, 'status' => 'Nueva']);
    }

    public function test_service_denies_cross_shelter_decisions_even_without_http_scope(): void
    {
        $a = $this->refuge('sur');
        $b = $this->refuge('norte');
        $request = $this->application(Animal::factory()->create(['shelter_id' => $b->id]), User::factory()->create());
        $this->expectException(HttpException::class);
        app(AdoptionService::class)->transition($request, $this->staff($a), 'Aprobada', 'Intento ajeno.');
    }

    public function test_veterinary_lists_agenda_and_writes_are_separated(): void
    {
        $a = $this->refuge('sur');
        $b = $this->refuge('norte');
        $own = Animal::factory()->create(['shelter_id' => $a->id]);
        $foreign = Animal::factory()->create(['shelter_id' => $b->id]);
        $vet = $this->staff($a);
        foreach ([$own, $foreign] as $animal) {
            $animal->controls()->create(['control_type' => 'Revisión', 'scheduled_date' => today(), 'status' => 'Pendiente', 'recorded_by' => $vet->id]);
            $animal->vaccinations()->create(['vaccine_name' => 'Prueba', 'application_date' => today(), 'next_dose_date' => today(), 'recorded_by' => $vet->id]);
        }
        $this->actingAs($vet);
        $this->get('/veterinaria')->assertInertia(fn (Assert $p) => $p->has('animals.data', 1));
        $this->get('/veterinaria/controles')->assertInertia(fn (Assert $p) => $p->has('controls.data', 1)->has('vaccinations', 1));
        $this->get('/veterinaria/'.$foreign->id)->assertNotFound();
        $this->post('/veterinaria/'.$foreign->id.'/consultations', [])->assertNotFound();
        $this->get('/veterinaria/'.$own->id)->assertOk();
    }

    public function test_disabled_shelter_blocks_new_activity_but_keeps_adopter_history(): void
    {
        $a = $this->refuge('sur');
        $animal = Animal::factory()->create(['shelter_id' => $a->id]);
        $adopter = User::factory()->create();
        $request = $this->application($animal, $adopter);
        $a->update(['active' => false]);
        $this->actingAs($this->staff($a))->get('/admin')->assertForbidden();
        $this->actingAs($adopter)->get('/mis-solicitudes')->assertInertia(fn (Assert $p) => $p->has('requests.data', 1));
        $this->get('/solicitudes/'.$request->id)->assertOk();
        $this->get('/animales/'.$animal->id)->assertNotFound();
        $this->get('/animales/'.$animal->id.'/solicitar')->assertNotFound();
        $this->post('/animales/'.$animal->id.'/solicitar', ['phone' => '1155551234', 'address' => 'Calle 123', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Experiencia previa.', 'motivation' => 'Un hogar responsable y permanente.'])->assertSessionHasErrors('status');
        $this->assertDatabaseCount('adoption_requests', 1);
        $this->assertDatabaseCount('adoption_request_history', 1);
    }

    public function test_only_superadmin_can_create_refuges_and_staff(): void
    {
        $a = $this->refuge('sur');
        foreach (['admin', 'veterinario', 'adoptante'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role, 'shelter_id' => $role === 'adoptante' ? null : $a->id]));
            $this->get('/superadmin/refugios')->assertForbidden();
            $this->post('/superadmin/refugios', [])->assertForbidden();
            $this->post('/superadmin/refugios/sur/personal', [])->assertForbidden();
        }
        $this->actingAs(User::factory()->create(['role' => 'superadmin']));
        $this->get('/dashboard')->assertRedirect('/superadmin/refugios');
        $this->post('/superadmin/refugios', ['name' => 'Nuevo', 'slug' => 'nuevo', 'active' => true])->assertSessionHasNoErrors();
        $this->post('/superadmin/refugios/nuevo/personal', ['name' => 'Ana', 'last_name' => 'Pérez', 'email' => 'admin@example.test', 'role' => 'admin', 'password' => 'clave-inicial-123', 'password_confirmation' => 'clave-inicial-123', 'shelter_id' => $a->id])->assertSessionHasNoErrors();
        $user = User::where('email', 'admin@example.test')->firstOrFail();
        $this->assertEquals(Shelter::where('slug', 'nuevo')->value('id'), $user->shelter_id);
        $this->assertTrue(Hash::check('clave-inicial-123', $user->password));
        $this->get('/superadmin/refugios')->assertOk()->assertDontSee('clave-inicial-123');
        $this->post('/superadmin/refugios/nuevo/personal', ['name' => 'Ana', 'last_name' => 'Pérez', 'email' => 'super@example.test', 'role' => 'superadmin', 'password' => 'clave-inicial-123', 'password_confirmation' => 'clave-inicial-123'])->assertSessionHasErrors('role');
    }

    public function test_admin_can_edit_only_own_public_profile(): void
    {
        $a = $this->refuge('sur');
        $this->actingAs($this->staff($a));
        $this->patch('/admin/refugio', ['name' => 'Sur actualizado', 'city' => 'Rosario', 'slug' => 'ataque', 'active' => false])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('shelters', ['id' => $a->id, 'name' => 'Sur actualizado', 'slug' => 'sur', 'active' => true]);
        $this->get('/admin/refugio')->assertOk();
    }

    public function test_registration_cannot_assign_a_shelter_or_superadmin_role(): void
    {
        $a = $this->refuge('sur');
        $this->post('/register', ['name' => 'Ana', 'last_name' => 'Pérez', 'email' => 'ana@example.test', 'password' => 'clave-inicial-123', 'password_confirmation' => 'clave-inicial-123', 'role' => 'superadmin', 'shelter_id' => $a->id])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', ['email' => 'ana@example.test', 'role' => 'adoptante', 'shelter_id' => null]);
    }
}
