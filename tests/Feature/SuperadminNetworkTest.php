<?php

namespace Tests\Feature;

use App\Models\Adoption;
use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use App\Models\VaccinationDose;
use App\Models\VeterinaryControl;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SuperadminNetworkTest extends TestCase
{
    use RefreshDatabase;

    private function superadmin(): User
    {
        return User::factory()->create(['role' => 'superadmin', 'shelter_id' => null]);
    }

    private function shelter(string $slug, bool $active = true): Shelter
    {
        return Shelter::create(['name' => ucfirst($slug), 'slug' => $slug, 'active' => $active]);
    }

    public function test_network_animals_include_other_refuges_inactive_refuges_and_archives(): void
    {
        $south = $this->shelter('sur');
        $north = $this->shelter('norte', false);
        Animal::factory()->create(['shelter_id' => $south->id, 'name' => 'Mora']);
        $archived = Animal::factory()->create(['shelter_id' => $north->id, 'name' => 'Luna']);
        $archived->delete();
        $this->actingAs($this->superadmin());

        $this->get('/superadmin/animales')->assertInertia(fn (Assert $page) => $page
            ->component('Superadmin/Network')->where('records.total', 2)
            ->where('records.data.0.animal', 'Luna')->where('records.data.0.archived', true));
        $this->get('/superadmin/animales?shelter='.$south->id.'&q=Mora&archive=active&status=Disponible')
            ->assertInertia(fn (Assert $page) => $page->where('records.total', 1)->where('records.data.0.shelter', 'Sur'));
        $this->get('/superadmin/animales?archive=archived')->assertInertia(fn (Assert $page) => $page->where('records.total', 1)->where('records.data.0.animal', 'Luna'));
    }

    public function test_network_controls_can_filter_overdue_without_including_completed_or_other_refuges(): void
    {
        $south = $this->shelter('sur');
        $north = $this->shelter('norte');
        $a = Animal::factory()->create(['shelter_id' => $south->id]);
        $b = Animal::factory()->create(['shelter_id' => $north->id]);
        $recorder = User::factory()->create(['role' => 'admin', 'shelter_id' => $south->id]);
        foreach ([[$a, 'Pendiente', -2], [$a, 'Realizado', -2], [$a, 'Pendiente', 2], [$b, 'Pendiente', -2]] as [$animal, $status, $offset]) {
            $animal->controls()->create(['control_type' => 'Control general', 'scheduled_date' => today()->addDays($offset)->toDateString(), 'status' => $status, 'recorded_by' => $recorder->id]);
        }
        $this->actingAs($this->superadmin());
        $this->get('/superadmin/controles?period=overdue&shelter='.$south->id)
            ->assertInertia(fn (Assert $page) => $page->where('records.total', 1)->where('records.data.0.status', 'Pendiente')->where('records.data.0.shelter', 'Sur'));
        $this->get('/superadmin/controles?status=Realizado')->assertInertia(fn (Assert $page) => $page->where('records.total', 1));
        $this->get('/superadmin/controles?period=upcoming')->assertInertia(fn (Assert $page) => $page->where('records.total', 1));
        $this->assertSame(4, VeterinaryControl::count());
    }

    public function test_dashboard_uses_real_network_totals_and_all_lists_render_when_empty(): void
    {
        $shelter = $this->shelter('sur');
        Animal::factory()->count(2)->create(['shelter_id' => $shelter->id]);
        $this->actingAs($this->superadmin());
        $this->get('/dashboard')->assertRedirect('/superadmin');
        $this->get('/superadmin')->assertInertia(fn (Assert $page) => $page
            ->component('Superadmin/Dashboard')->where('stats.0.value', Shelter::where('active', true)->count())->where('stats.1.value', 2)
            ->where('shelters', fn ($items) => collect($items)->firstWhere('id', $shelter->id)['animals_count'] === 2)->where('species.0.total', 2));
        foreach (['solicitudes', 'adopciones', 'controles', 'dosis'] as $view) {
            $this->get('/superadmin/'.$view)->assertInertia(fn (Assert $page) => $page->where('view', $view)->where('records.total', 0));
        }
    }

    public function test_clinical_history_is_read_only_and_superadmin_cannot_write_clinical_records(): void
    {
        $shelter = $this->shelter('sur');
        $animal = Animal::factory()->create(['shelter_id' => $shelter->id]);
        $this->actingAs($this->superadmin());
        $this->get('/superadmin/animales/'.$animal->id.'/historia')->assertInertia(fn (Assert $page) => $page
            ->component('Veterinaria/History')->where('readOnly', true)->where('animal.shelter.name', 'Sur'));
        $this->post('/veterinaria/'.$animal->id.'/controls', [])->assertForbidden();
        $this->patch('/admin/animales/'.$animal->id, [])->assertForbidden();
        $animal->delete();
        $this->get('/superadmin/animales/'.$animal->id.'/historia')->assertOk();
    }

    public function test_only_superadmin_can_open_network_and_refuge_admin_keeps_its_scope(): void
    {
        $south = $this->shelter('sur');
        $north = $this->shelter('norte');
        Animal::factory()->create(['shelter_id' => $south->id]);
        Animal::factory()->create(['shelter_id' => $north->id]);
        $this->get('/superadmin')->assertRedirect('/login');
        foreach (['admin', 'adoptante'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role, 'shelter_id' => $role === 'admin' ? $south->id : null]));
            foreach (['', '/animales', '/controles', '/solicitudes', '/adopciones', '/dosis'] as $path) {
                $this->get('/superadmin'.$path)->assertForbidden();
            }
            if ($role === 'admin') {
                $this->get('/admin/animales')->assertInertia(fn (Assert $page) => $page->where('animals.total', 1));
            }
        }
    }

    public function test_pagination_preserves_refuge_filter_and_invalid_filters_are_rejected(): void
    {
        $shelter = $this->shelter('sur');
        Animal::factory()->count(16)->create(['shelter_id' => $shelter->id]);
        $this->actingAs($this->superadmin());
        $this->get('/superadmin/animales?shelter='.$shelter->id.'&page=2')->assertInertia(fn (Assert $page) => $page
            ->where('records.total', 16)->has('records.data', 1)
            ->where('records.prev_page_url', url('/superadmin/animales?shelter='.$shelter->id.'&page=1')));
        $this->get('/superadmin/animales?status=Inventado')->assertSessionHasErrors('status');
        $this->get('/superadmin/animales?shelter=999999')->assertSessionHasErrors('shelter');
    }

    public function test_superadmin_can_consult_application_without_gaining_permission_to_approve_it(): void
    {
        $shelter = $this->shelter('sur');
        $animal = Animal::factory()->create(['shelter_id' => $shelter->id]);
        $user = User::factory()->create();
        $application = new AdoptionRequest;
        $application->forceFill(['animal_id' => $animal->id, 'user_id' => $user->id, 'status' => 'Nueva', 'phone' => '12345678', 'address' => 'Domicilio de prueba', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Sin experiencia', 'motivation' => 'Solicitud ficticia de prueba'])->save();
        $this->actingAs($this->superadmin());
        $this->get('/superadmin/solicitudes/'.$application->id)->assertInertia(fn (Assert $page) => $page
            ->component('Adoptante/RequestDetail')->where('application.id', $application->id));
        $this->patch('/admin/solicitudes/'.$application->id, ['status' => 'Aprobada', 'observations' => 'Prueba'])->assertForbidden();
        $this->assertSame('Nueva', $application->fresh()->status);
    }

    public function test_vaccination_and_adoption_records_show_their_real_data_and_refuge(): void
    {
        $shelter = $this->shelter('sur');
        $animal = Animal::factory()->create(['shelter_id' => $shelter->id, 'name' => 'Mora']);
        $recorder = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $user = User::factory()->create(['name' => 'Ana', 'last_name' => 'Prueba']);
        $vaccine = $animal->vaccinations()->create(['vaccine_name' => 'Antirrábica', 'application_date' => today()->subYear()->toDateString(), 'recorded_by' => $recorder->id]);
        VaccinationDose::create(['animal_id' => $animal->id, 'source_vaccination_id' => $vaccine->id, 'scheduled_date' => today()->subDay(), 'status' => 'Pendiente']);
        $application = new AdoptionRequest;
        $application->forceFill(['animal_id' => $animal->id, 'user_id' => $user->id, 'status' => 'Adoptado', 'phone' => '12345678', 'address' => 'Domicilio de prueba', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Sin experiencia', 'motivation' => 'Solicitud ficticia de prueba'])->save();
        Adoption::create(['animal_id' => $animal->id, 'user_id' => $user->id, 'adoption_request_id' => $application->id, 'adoption_date' => today()->toDateString(), 'registered_by' => $recorder->id]);
        $this->actingAs($this->superadmin());

        $this->get('/superadmin/dosis?period=overdue&shelter='.$shelter->id)->assertInertia(fn (Assert $page) => $page
            ->where('records.total', 1)->where('records.data.0.detail', 'Antirrábica')->where('records.data.0.shelter', 'Sur'));
        $this->get('/superadmin/adopciones?q=Ana')->assertInertia(fn (Assert $page) => $page
            ->where('records.total', 1)->where('records.data.0.detail', 'Ana Prueba')->where('records.data.0.animal', 'Mora'));
        $this->get('/superadmin/solicitudes?status=Adoptado')->assertInertia(fn (Assert $page) => $page
            ->where('records.total', 1)->where('records.data.0.href', '/superadmin/solicitudes/'.$application->id));
    }
}
