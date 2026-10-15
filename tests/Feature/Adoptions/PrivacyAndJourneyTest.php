<?php

namespace Tests\Feature\Adoptions;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use App\Services\AdoptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PrivacyAndJourneyTest extends TestCase
{
    use RefreshDatabase;

    private function submit(Animal $animal, User $user)
    {
        return app(AdoptionService::class)->submit($animal, $user, ['phone' => '0000000000', 'address' => 'Domicilio ficticio', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Prueba', 'motivation' => 'Una familia responsable para este animal.']);
    }

    public function test_private_notes_are_only_sent_to_own_staff_and_public_history_survives_deactivation(): void
    {
        $animal = Animal::factory()->create();
        $owner = User::factory()->create();
        $staff = User::factory()->create(['role' => 'admin', 'shelter_id' => $animal->shelter_id]);
        $application = $this->submit($animal, $owner);
        $this->actingAs($owner)->get('/animales/'.$animal->id.'/solicitar')->assertRedirect('/solicitudes/'.$application->id);
        $this->actingAs($staff)->patch('/admin/solicitudes/'.$application->id, ['status' => 'En revisión', 'observations' => 'Coordinaremos los próximos pasos.', 'internal_notes' => 'NOTA INTERNA SENSIBLE'])->assertSessionHasNoErrors();
        $this->get('/solicitudes/'.$application->id)->assertInertia(fn (Assert $p) => $p->where('application.history.1.internal_notes', 'NOTA INTERNA SENSIBLE')->has('application.history.1.actor'));
        $this->actingAs($owner)->get('/solicitudes/'.$application->id)->assertInertia(fn (Assert $p) => $p
            ->where('application.history.1.observations', 'Coordinaremos los próximos pasos.')
            ->missing('application.history.1.internal_notes')->missing('application.history.1.changed_by')
            ->missing('application.history.1.actor')->missing('application.reviewed_by'))->assertDontSee('NOTA INTERNA SENSIBLE');
        $animal->shelter->update(['active' => false]);
        $this->get('/mis-solicitudes')->assertInertia(fn (Assert $p) => $p->where('requests.data.0.id', $application->id));
        $this->get('/solicitudes/'.$application->id)->assertOk()->assertDontSee('NOTA INTERNA SENSIBLE');
        $this->actingAs($staff)->patch('/admin/solicitudes/'.$application->id, ['status' => 'Aprobada', 'observations' => 'Intento inválido.'])->assertForbidden();
    }

    public function test_two_refuges_and_all_roles_enforce_identity_and_decisions(): void
    {
        $animal = Animal::factory()->create();
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $foreignShelter = Shelter::create(['name' => 'Otro', 'slug' => 'otro', 'active' => true]);
        $foreignStaff = User::factory()->create(['role' => 'admin', 'shelter_id' => $foreignShelter->id]);
        $this->actingAs($owner)->post('/animales/'.$animal->id.'/solicitar', [
            'phone' => '0000000000', 'address' => 'Prueba', 'housing_type' => 'Casa', 'has_other_pets' => false,
            'previous_experience' => 'Prueba', 'motivation' => 'Quiero acompañar una adopción responsable.',
            'user_id' => $other->id, 'shelter_id' => $foreignShelter->id, 'role' => 'admin', 'status' => 'Aprobada',
        ])->assertSessionHasNoErrors();
        $application = $owner->adoptionRequests()->firstOrFail();
        $this->assertSame('Nueva', $application->status);
        $this->actingAs($other)->get('/solicitudes/'.$application->id)->assertForbidden();
        $this->actingAs($foreignStaff)->get('/solicitudes/'.$application->id)->assertNotFound();
        $this->patch('/admin/solicitudes/'.$application->id, ['status' => 'Aprobada', 'observations' => 'No corresponde.'])->assertNotFound();
        $this->get('/animales')->assertInertia(fn (Assert $p) => $p->where('animals.total', 1));
        $this->actingAs(User::factory()->create(['role' => 'superadmin']))->get('/solicitudes/'.$application->id)->assertForbidden();
        $this->patch('/admin/solicitudes/'.$application->id, [])->assertForbidden();
    }

    public function test_approval_reserves_and_adoption_later_closes_other_requests_with_public_reasons(): void
    {
        $animal = Animal::factory()->create();
        $one = $this->submit($animal, User::factory()->create());
        $two = $this->submit($animal, User::factory()->create());
        $staff = User::factory()->create(['role' => 'admin', 'shelter_id' => $animal->shelter_id]);
        $this->actingAs($staff)->patch('/admin/solicitudes/'.$one->id, ['status' => 'Aprobada', 'observations' => 'Coordinar encuentro.'])->assertSessionHasNoErrors();
        $this->assertSame('En proceso de adopción', $animal->fresh()->availability_status);
        $this->assertSame(0, $animal->adoption()->count());
        $this->patch('/admin/solicitudes/'.$two->id, ['status' => 'Aprobada', 'observations' => 'No puede duplicarse.'])->assertSessionHasErrors('status');
        $this->patch('/admin/solicitudes/'.$one->id, ['status' => 'Adoptado', 'observations' => 'Adopción concretada.'])->assertSessionHasNoErrors();
        $this->assertSame(1, $animal->adoption()->count());
        $this->assertSame('Rechazada', $two->fresh()->status);
        $this->assertStringContainsString('otra familia', $two->history()->reorder('id', 'desc')->first()->observations);
        $this->patch('/admin/solicitudes/'.$one->id, ['status' => 'Adoptado', 'observations' => 'Segundo intento.'])->assertSessionHasErrors('status');
        $this->assertSame(3, $one->history()->count());
    }
}
