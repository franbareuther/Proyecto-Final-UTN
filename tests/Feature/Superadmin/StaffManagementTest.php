<?php

namespace Tests\Feature\Superadmin;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StaffManagementTest extends TestCase
{
    use RefreshDatabase;

    private function refuge(string $slug): Shelter
    {
        return Shelter::create(['name' => 'Refugio '.$slug, 'slug' => $slug, 'active' => true]);
    }

    private function editor(User $staff, array $changes = []): array
    {
        return array_replace(['name' => $staff->name, 'last_name' => $staff->last_name ?: 'Prueba', 'email' => $staff->email, 'suspended' => false], $changes);
    }

    public function test_edit_suspend_and_reactivate_preserve_identity_and_revoke_prior_sessions(): void
    {
        $shelter = $this->refuge('sur');
        $staff = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $animal = Animal::factory()->create(['shelter_id' => $shelter->id]);
        $animal->controls()->create(['recorded_by' => $staff->id, 'control_type' => 'Revisión', 'scheduled_date' => today(), 'status' => 'Pendiente']);
        $password = $staff->password;
        $superadmin = User::factory()->create(['role' => 'superadmin']);
        $endpoint = '/superadmin/refugios/sur/personal/'.$staff->id;
        $this->actingAs($superadmin)->patch($endpoint, $this->editor($staff, ['name' => 'Nombre corregido']))->assertSessionHasNoErrors();
        $this->assertSame(0, $staff->fresh()->access_version);
        $this->patch($endpoint, $this->editor($staff, ['suspended' => true]))->assertSessionHasNoErrors();
        $this->assertTrue($staff->fresh()->isSuspended());
        $this->actingAs($staff->fresh())->withSession(['staff_access_version' => 0])->get('/admin')->assertRedirect('/login');
        $this->assertGuest();
        $this->post('/login', ['email' => $staff->email, 'password' => 'password'])->assertSessionHasErrors('email');
        $this->assertGuest();
        $this->actingAs($superadmin)->patch($endpoint, $this->editor($staff))->assertSessionHasNoErrors();
        $this->assertSame(2, $staff->fresh()->access_version);
        // A session untouched during suspension must still expire after reactivation.
        $this->actingAs($staff->fresh())->withSession(['staff_access_version' => 0])->get('/admin')->assertRedirect('/login');
        $this->post('/login', ['email' => $staff->email, 'password' => 'password'])->assertSessionHasNoErrors()->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($staff);
        $this->get('/admin')->assertOk();
        $this->assertSame($password, $staff->fresh()->password);
        $this->assertSame($shelter->id, $staff->fresh()->shelter_id);
        $this->assertDatabaseHas('veterinary_controls', ['animal_id' => $animal->id, 'recorded_by' => $staff->id]);
    }

    public function test_email_change_rotates_access_and_legacy_sessions_work_only_before_revocation(): void
    {
        $shelter = $this->refuge('sur');
        $staff = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id, 'remember_token' => 'previous-token']);
        $this->actingAs($staff)->get('/admin')->assertOk()->assertSessionHas('staff_access_version', 0);
        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->patch('/superadmin/refugios/sur/personal/'.$staff->id, $this->editor($staff, ['email' => 'corregido@example.test']))->assertSessionHasNoErrors();
        $this->assertSame(1, $staff->fresh()->access_version);
        $this->assertNull($staff->fresh()->email_verified_at);
        $this->assertNotSame('previous-token', $staff->fresh()->remember_token);
        session()->forget('staff_access_version');
        $this->actingAs($staff->fresh())->get('/admin')->assertRedirect('/login');
    }

    public function test_only_superadmin_manages_staff_without_transfers_or_new_roles(): void
    {
        $shelter = $this->refuge('sur');
        $other = $this->refuge('norte');
        $staff = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $adopter = User::factory()->create();
        $superadmin = User::factory()->create(['role' => 'superadmin']);
        $endpoint = '/superadmin/refugios/sur/personal/'.$staff->id;
        foreach ([$staff, $adopter] as $actor) {
            $this->actingAs($actor)->patch($endpoint, $this->editor($staff))->assertForbidden();
        }
        $this->actingAs($superadmin);
        $this->patch('/superadmin/refugios/norte/personal/'.$staff->id, $this->editor($staff))->assertNotFound();
        foreach ([$adopter, $superadmin] as $protected) {
            $this->patch('/superadmin/refugios/sur/personal/'.$protected->id, $this->editor($protected, ['suspended' => true]))->assertNotFound();
        }
        $this->patch($endpoint, $this->editor($staff, ['shelter_id' => $other->id, 'role' => 'superadmin']))->assertSessionHasErrors(['shelter_id', 'role']);
        $this->patch($endpoint, $this->editor($staff, ['email' => $adopter->email]))->assertSessionHasErrors('email');
        foreach (['veterinario', 'superadmin', 'adoptante'] as $role) {
            $this->post('/superadmin/refugios/sur/personal', ['name' => 'Ana', 'last_name' => 'Prueba', 'email' => 'new@example.test', 'password' => 'una-clave-segura', 'password_confirmation' => 'una-clave-segura', 'role' => $role])->assertSessionHasErrors('role');
        }
        $this->assertSame('admin', $staff->fresh()->role);
        $this->assertSame($shelter->id, $staff->fresh()->shelter_id);
        $this->assertFalse($staff->fresh()->isSuspended());
    }

    public function test_search_and_independent_staff_pagination_keep_selection_and_private_fields_hidden(): void
    {
        $shelter = $this->refuge('sur');
        $shelter->update(['city' => 'Rosario']);
        $other = $this->refuge('norte');
        User::factory()->count(11)->create(['role' => 'admin', 'shelter_id' => $shelter->id, 'name' => 'Personal sur']);
        User::factory()->create(['role' => 'admin', 'shelter_id' => $other->id, 'name' => 'Ajeno']);
        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->get('/superadmin/refugios?q=Rosario&state=active&selected='.$shelter->id.'&staff_q=Personal&staff_state=active&staff_page=2')
            ->assertInertia(fn (Assert $p) => $p->has('shelters', 1)->where('selectedShelter.id', $shelter->id)->where('staffPagination.total', 11)->has('selectedShelter.staff', 1)->missing('selectedShelter.staff.0.password')->missing('selectedShelter.staff.0.access_version'));
        $this->get('/superadmin/refugios?q=sin-coincidencias')->assertInertia(fn (Assert $p) => $p->has('shelters', 0)->where('pagination.total', 0));
        $this->get('/superadmin/refugios?state=arbitrario')->assertSessionHasErrors('state');
        foreach (range(1, 14) as $number) {
            $this->refuge('extra-'.$number);
        }
        $this->get('/superadmin/refugios?state=active&page=2')->assertInertia(fn (Assert $p) => $p->where('pagination.current_page', 2)->has('shelters', 5));
    }

    public function test_refuge_deactivation_and_public_profile_permissions_keep_existing_data(): void
    {
        $shelter = $this->refuge('sur');
        $shelter->forceFill(['image_path' => 'shelters/prior.png', 'image_type' => 'logo'])->save();
        $staff = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $animal = Animal::factory()->create(['shelter_id' => $shelter->id]);
        $this->actingAs($staff)->patch('/admin/refugio', ['name' => 'Nombre público', 'slug' => 'traslado', 'active' => false])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('shelters', ['id' => $shelter->id, 'slug' => 'sur', 'active' => true, 'image_path' => 'shelters/prior.png']);
        $superadmin = User::factory()->create(['role' => 'superadmin']);
        $this->actingAs($superadmin)->patch('/superadmin/refugios/sur', ['name' => 'Sur', 'slug' => 'sur', 'active' => false])->assertSessionHasNoErrors();
        $this->get('/refugios/sur')->assertNotFound();
        $this->actingAs($staff)->get('/admin')->assertForbidden();
        $this->patch('/admin/refugio', ['name' => 'No permitido'])->assertForbidden();
        $this->actingAs($superadmin)->patch('/superadmin/refugios/sur', ['name' => 'Sur', 'slug' => 'sur', 'active' => true])->assertSessionHasNoErrors();
        $this->actingAs($staff)->get('/admin')->assertOk();
        $this->assertDatabaseHas('animals', ['id' => $animal->id, 'shelter_id' => $shelter->id, 'deleted_at' => null]);
        $this->assertDatabaseHas('shelters', ['id' => $shelter->id, 'image_path' => 'shelters/prior.png', 'image_type' => 'logo']);
    }

    public function test_cancelled_staff_save_does_not_persist_partial_identity_or_access_changes(): void
    {
        $shelter = $this->refuge('sur');
        $staff = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $this->actingAs(User::factory()->create(['role' => 'superadmin']));
        User::saving(fn () => false);
        try {
            $this->patch('/superadmin/refugios/sur/personal/'.$staff->id, $this->editor($staff, ['name' => 'No guardado', 'suspended' => true]))->assertSessionHasErrors('email');
            $this->assertDatabaseHas('users', ['id' => $staff->id, 'name' => $staff->name, 'access_version' => 0, 'suspended_at' => null]);
        } finally {
            User::flushEventListeners();
        }
    }
}
