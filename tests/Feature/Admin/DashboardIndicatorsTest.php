<?php

namespace Tests\Feature\Admin;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use App\Services\AdoptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardIndicatorsTest extends TestCase
{
    use RefreshDatabase;

    public function test_indicators_distinguish_archived_animals_and_preserve_scoped_historical_totals(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 15)->startOfDay());
        $shelters = collect(['sur', 'norte'])->map(fn ($slug) => Shelter::create(['name' => $slug, 'slug' => $slug, 'active' => true]));
        $administrators = [];
        foreach ($shelters as $shelter) {
            $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
            $administrators[] = $admin;
            $available = Animal::factory()->create(['shelter_id' => $shelter->id, 'species' => 'Gato']);
            Animal::factory()->create(['shelter_id' => $shelter->id, 'species' => 'Perro', 'availability_status' => 'No disponible temporalmente']);
            $adopted = Animal::factory()->create(['shelter_id' => $shelter->id]);
            $adopter = User::factory()->create();
            $data = ['phone' => '1155551234', 'address' => 'Calle ficticia', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Experiencia', 'motivation' => 'Hogar responsable'];
            $service = app(AdoptionService::class);
            $service->submit($available, $adopter, $data);
            $request = $service->submit($adopted, $adopter, $data);
            $service->transition($request, $admin, 'Aprobada', 'Aprobación ficticia');
            $service->transition($request, $admin, 'Adoptado', 'Adopción ficticia');
            $adopted->delete();
            // Duplicate active treatments count one animal, including archived clinical history.
            foreach (range(1, 2) as $number) {
                $adopted->treatments()->create(['description' => 'Indicación '.$number, 'start_date' => today(), 'status' => 'Activo', 'recorded_by' => $admin->id]);
            }
            $available->treatments()->create(['description' => 'Finalizado', 'start_date' => today(), 'status' => 'Finalizado', 'recorded_by' => $admin->id]);
            foreach ([-1, 0, 30, 31] as $offset) {
                $adopted->controls()->create(['control_type' => 'Control ficticio', 'scheduled_date' => today()->addDays($offset), 'status' => 'Pendiente', 'recorded_by' => $admin->id]);
            }
            $available->controls()->create(['control_type' => 'Realizado', 'scheduled_date' => today(), 'status' => 'Realizado', 'recorded_by' => $admin->id]);
        }
        foreach ($administrators as $admin) {
            $this->actingAs($admin)->get('/admin')->assertInertia(fn (Assert $p) => $p
                ->where('stats.Animales registrados', 2)->where('stats.Animales archivados', 1)
                ->where('stats.Disponibles', 1)->where('stats.Adopciones realizadas', 1)
                ->where('stats.Solicitudes pendientes', 1)->where('stats.Animales en tratamiento', 1)
                ->where('stats.Controles en 30 días', 2)->has('species', 2)
                ->where('months.5.total', 1)->has('recentRequests', 2)->has('recentAdoptions', 1)
                ->where('recentAdoptions.0.animal.shelter_id', $admin->shelter_id)
                ->where('controls', fn ($controls) => collect($controls)->every(fn ($control) => $control['animal']['shelter_id'] === $admin->shelter_id)));
        }
        $this->actingAs(User::factory()->create(['role' => 'superadmin']))->get('/admin')->assertForbidden();
        $this->actingAs(User::factory()->create())->get('/admin')->assertForbidden();
    }
}
