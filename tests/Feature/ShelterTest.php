<?php

namespace Tests\Feature;

use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ShelterTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role = 'adoptante'): User
    {
        return User::factory()->create(['role' => $role, 'last_name' => 'Prueba']);
    }

    private function data(): array
    {
        return ['phone' => '1155551234', 'address' => 'Calle 123', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Conviví con perros.', 'motivation' => 'Quiero ofrecerle un hogar responsable y permanente.'];
    }

    private function submit(?Animal $a = null, ?User $u = null): AdoptionRequest
    {
        $a ??= Animal::factory()->create();
        $u ??= $this->user();
        $this->actingAs($u)->post('/animales/'.$a->id.'/solicitar', $this->data())->assertSessionHasNoErrors()->assertRedirect();

        return AdoptionRequest::latest('id')->firstOrFail();
    }

    private function decision(AdoptionRequest $r, string $state)
    {
        return $this->patch('/admin/solicitudes/'.$r->id, ['status' => $state, 'observations' => 'Decisión fundamentada del refugio.']);
    }

    public function test_public_registration_cannot_choose_a_privileged_role(): void
    {
        $this->post('/register', ['name' => 'Ana', 'last_name' => 'Pérez', 'email' => 'ana@example.test', 'password' => 'test-password-123', 'password_confirmation' => 'test-password-123', 'role' => 'admin'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', ['email' => 'ana@example.test', 'role' => 'adoptante', 'last_name' => 'Pérez']);
    }

    public function test_roles_protect_admin_and_veterinary_routes(): void
    {
        $this->get('/admin')->assertRedirect('/login');
        $this->actingAs($this->user())->get('/admin')->assertForbidden();
        $this->get('/admin/animales')->assertForbidden();
        $this->get('/veterinaria')->assertForbidden();
        $this->actingAs($this->user('veterinario'))->get('/admin/solicitudes')->assertForbidden();
        $this->get('/dashboard')->assertRedirect('/veterinaria');
    }

    public function test_admin_can_create_update_and_archive_an_animal(): void
    {
        $this->actingAs($this->user('admin'));
        $payload = Animal::factory()->make(['name' => 'Mora'])->getAttributes();
        $this->post('/admin/animales', $payload)->assertSessionHasNoErrors();
        $a = Animal::firstOrFail();
        $this->put('/admin/animales/'.$a->id, array_merge($payload, ['name' => 'Mora nueva']))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('animals', ['id' => $a->id, 'name' => 'Mora nueva']);
        $this->delete('/admin/animales/'.$a->id)->assertSessionHasNoErrors();
        $this->assertSoftDeleted($a);
    }

    public function test_catalog_filters_real_records_and_hides_internal_medical_data(): void
    {
        $a = Animal::factory()->create(['name' => 'Mora', 'species' => 'Gato', 'breed' => 'Mestizo', 'estimated_age' => 8, 'size' => 'Pequeño']);
        Animal::factory()->create(['name' => 'Bruno', 'estimated_age' => 50]);
        $a->consultations()->create(['veterinarian_id' => $this->user('veterinario')->id, 'consultation_date' => today(), 'reason' => 'Interno', 'diagnosis' => 'DATO CLINICO PRIVADO']);
        $this->get('/animales?q=Mora&species=Gato&breed=Mestizo&age=young&size=Pequeño')->assertInertia(fn (Assert $p) => $p->component('Public/Catalog')->has('animals.data', 1)->where('animals.data.0.id', $a->id));
        $this->get('/animales/'.$a->id)->assertInertia(fn (Assert $p) => $p->missing('animal.consultations')->missing('animal.requests'))->assertDontSee('DATO CLINICO PRIVADO');
    }

    public function test_application_uses_authenticated_identity_and_starts_new(): void
    {
        $u = $this->user();
        $other = $this->user();
        $a = Animal::factory()->create();
        $this->actingAs($u)->post('/animales/'.$a->id.'/solicitar', $this->data() + ['user_id' => $other->id, 'status' => 'Aprobada'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('adoption_requests', ['user_id' => $u->id, 'animal_id' => $a->id, 'status' => 'Nueva']);
        $this->assertDatabaseCount('adoption_request_history', 1);
    }

    public function test_duplicate_active_requests_are_rejected(): void
    {
        $r = $this->submit();
        $this->post('/animales/'.$r->animal_id.'/solicitar', $this->data())->assertSessionHasErrors('status');
        $this->assertDatabaseCount('adoption_requests', 1);
    }

    public function test_unavailable_and_adopted_animals_cannot_be_requested(): void
    {
        $this->actingAs($this->user());
        foreach (['Adoptado', 'No disponible temporalmente', 'En proceso de adopción'] as $state) {
            $a = Animal::factory()->create(['availability_status' => $state]);
            $this->post('/animales/'.$a->id.'/solicitar', $this->data())->assertSessionHasErrors('status');
        }
        $this->assertDatabaseCount('adoption_requests', 0);
    }

    public function test_only_owner_and_admin_can_view_a_request(): void
    {
        $r = $this->submit();
        $this->actingAs($this->user())->get('/solicitudes/'.$r->id)->assertForbidden();
        $this->get('/mis-solicitudes')->assertInertia(fn (Assert $p) => $p->has('requests.data', 0));
        $this->actingAs($r->user)->get('/solicitudes/'.$r->id)->assertOk();
        $this->patch('/admin/solicitudes/'.$r->id, ['status' => 'Aprobada'])->assertForbidden();
        $this->actingAs($this->user('veterinario'))->get('/solicitudes/'.$r->id)->assertForbidden();
    }

    public function test_approval_reserves_but_does_not_register_adoption(): void
    {
        $r = $this->submit();
        $this->actingAs($this->user('admin'));
        $this->decision($r, 'En revisión')->assertSessionHasNoErrors();
        $this->decision($r, 'Aprobada')->assertSessionHasNoErrors();
        $this->assertSame('Aprobada', $r->fresh()->status);
        $this->assertSame('En proceso de adopción', $r->animal->availability_status);
        $this->assertDatabaseCount('adoptions', 0);
    }

    public function test_two_requests_cannot_be_approved_for_one_animal(): void
    {
        $r = $this->submit();
        $s = $this->submit($r->animal);
        $this->actingAs($this->user('admin'));
        $this->decision($r, 'Aprobada')->assertSessionHasNoErrors();
        $this->decision($s, 'Aprobada')->assertSessionHasErrors('status');
        $this->assertSame('Nueva', $s->fresh()->status);
    }

    public function test_final_adoption_updates_both_states_and_explains_other_closures(): void
    {
        $r = $this->submit();
        $other = $this->submit($r->animal);
        $admin = $this->user('admin');
        $this->actingAs($admin);
        $this->decision($r, 'Aprobada')->assertSessionHasNoErrors();
        $this->decision($r, 'Adoptado')->assertSessionHasNoErrors();
        $this->assertSame('Adoptado', $r->fresh()->status);
        $this->assertSame('Adoptado', $r->animal()->first()->availability_status);
        $this->assertDatabaseHas('adoptions', ['animal_id' => $r->animal_id, 'adoption_request_id' => $r->id, 'registered_by' => $admin->id]);
        $this->assertSame('Rechazada', $other->fresh()->status);
        $this->assertStringContainsString('otra familia', $other->history()->reorder('id', 'desc')->first()->observations);
        $this->decision($r, 'Adoptado')->assertSessionHasErrors('status');
        $this->assertDatabaseCount('adoptions', 1);
    }

    public function test_rejection_is_terminal_and_releases_an_approved_reservation(): void
    {
        $r = $this->submit();
        $this->actingAs($this->user('admin'));
        $this->decision($r, 'Aprobada');
        $this->decision($r, 'Rechazada')->assertSessionHasNoErrors();
        $this->assertSame('Disponible', $r->animal->availability_status);
        $this->decision($r, 'Adoptado')->assertSessionHasErrors('status');
        $this->assertDatabaseCount('adoptions', 0);
    }

    public function test_new_request_cannot_skip_approval(): void
    {
        $r = $this->submit();
        $this->actingAs($this->user('admin'));
        $this->decision($r, 'Adoptado')->assertSessionHasErrors('status');
        $this->assertDatabaseCount('adoptions', 0);
    }

    public function test_active_requests_prevent_archiving_or_manual_unavailability(): void
    {
        $r = $this->submit();
        $this->actingAs($this->user('admin'));
        $this->delete('/admin/animales/'.$r->animal_id)->assertSessionHasErrors('animal');
        $data = $r->animal->getAttributes();
        $data['availability_status'] = 'No disponible temporalmente';
        $this->put('/admin/animales/'.$r->animal_id, $data)->assertSessionHasErrors('availability_status');
    }

    public function test_medical_records_require_authorized_veterinarian_and_ignore_spoofed_author(): void
    {
        $a = Animal::factory()->create();
        $v = $this->user('veterinario');
        $payload = ['consultation_date' => today()->toDateString(), 'reason' => 'Ingreso', 'diagnosis' => 'Evaluación del profesional', 'veterinarian_id' => $this->user()->id];
        $this->actingAs($this->user())->get('/veterinaria/'.$a->id)->assertForbidden();
        $this->post('/veterinaria/'.$a->id.'/consultations', $payload)->assertForbidden();
        $this->actingAs($this->user('admin'))->get('/veterinaria/'.$a->id)->assertOk();
        $this->post('/veterinaria/'.$a->id.'/consultations', $payload)->assertForbidden();
        $this->actingAs($v)->post('/veterinaria/'.$a->id.'/consultations', $payload)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('medical_consultations', ['animal_id' => $a->id, 'veterinarian_id' => $v->id]);
        $this->get('/veterinaria/'.$a->id)->assertOk();
    }

    public function test_vaccinations_treatments_and_controls_can_be_recorded_and_completed(): void
    {
        $a = Animal::factory()->create();
        $v = $this->user('veterinario');
        $this->actingAs($v);
        $this->post('/veterinaria/'.$a->id.'/vaccinations', ['vaccine_name' => 'Antirrábica', 'application_date' => today()->toDateString(), 'next_dose_date' => today()->addYear()->toDateString()])->assertSessionHasNoErrors();
        $this->post('/veterinaria/'.$a->id.'/treatments', ['description' => 'Tratamiento indicado', 'start_date' => today()->toDateString(), 'status' => 'Activo'])->assertSessionHasNoErrors();
        $this->post('/veterinaria/'.$a->id.'/controls', ['control_type' => 'General', 'scheduled_date' => today()->toDateString(), 'status' => 'Pendiente'])->assertSessionHasNoErrors();
        $c = $a->controls()->first();
        $this->patch('/veterinaria/'.$a->id.'/controls/'.$c->id, ['control_type' => 'General', 'scheduled_date' => today()->toDateString(), 'status' => 'Realizado'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('veterinary_controls', ['id' => $c->id, 'status' => 'Realizado']);
        $this->assertDatabaseCount('vaccinations', 1);
        $this->assertDatabaseCount('treatments', 1);
        $this->actingAs($this->user('veterinario'))->patch('/veterinaria/'.$a->id.'/controls/'.$c->id, ['control_type' => 'General', 'scheduled_date' => today()->toDateString(), 'status' => 'Cancelado'])->assertForbidden();
    }

    public function test_medical_dates_are_validated(): void
    {
        $a = Animal::factory()->create();
        $this->actingAs($this->user('veterinario'));
        $this->post('/veterinaria/'.$a->id.'/vaccinations', ['vaccine_name' => 'Prueba', 'application_date' => today()->toDateString(), 'next_dose_date' => today()->subDay()->toDateString()])->assertSessionHasErrors('next_dose_date');
    }

    public function test_dashboard_calculates_statistics_from_database(): void
    {
        $r = $this->submit();
        $v = $this->user('veterinario');
        $r->animal->treatments()->create(['veterinarian_id' => $v->id, 'description' => 'Tratamiento', 'start_date' => today(), 'status' => 'Activo']);
        $r->animal->controls()->create(['veterinarian_id' => $v->id, 'control_type' => 'General', 'scheduled_date' => today()->addDay(), 'status' => 'Pendiente']);
        $this->actingAs($this->user('admin'))->get('/admin')->assertInertia(fn (Assert $p) => $p->where('stats.Animales registrados', 1)->where('stats.Disponibles', 1)->where('stats.Solicitudes pendientes', 1)->where('stats.Adopciones realizadas', 0)->where('stats.Animales en tratamiento', 1)->where('stats.Controles en 30 días', 1)->has('months', 6));
    }

    public function test_photos_are_stored_validated_and_scoped_to_animal(): void
    {
        Storage::fake('public');
        $a = Animal::factory()->create();
        $b = Animal::factory()->create();
        $this->actingAs($this->user('admin'));
        // PNG real de 1 píxel: evita depender de GD en XAMPP.
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6WT0AAAAASUVORK5CYII=');
        $this->put('/admin/animales/'.$a->id, array_merge($a->getAttributes(), ['photos' => [UploadedFile::fake()->createWithContent('foto.png', $png)]]))->assertSessionHasNoErrors();
        $photo = $a->photos()->firstOrFail();
        Storage::disk('public')->assertExists($photo->file_path);
        $this->delete('/admin/animales/'.$b->id.'/fotos/'.$photo->id)->assertNotFound();
        $this->put('/admin/animales/'.$a->id, array_merge($a->getAttributes(), ['photos' => [UploadedFile::fake()->create('malicioso.svg', 10, 'image/svg+xml')]]))->assertSessionHasErrors('photos.0');
        $this->delete('/admin/animales/'.$a->id.'/fotos/'.$photo->id)->assertSessionHasNoErrors();
        Storage::disk('public')->assertMissing($photo->file_path);
    }
}
