<?php

namespace Tests\Feature\Health;

use App\Models\Animal;
use App\Models\HealthAudit;
use App\Models\Shelter;
use App\Models\User;
use App\Models\VaccinationDose;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HealthWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Animal $animal;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(now()->setDate(2026, 10, 15)->startOfDay());
        $shelter = Shelter::create(['name' => 'Sur', 'slug' => 'sur', 'active' => true]);
        $this->admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $this->animal = Animal::factory()->create(['shelter_id' => $shelter->id]);
        $this->actingAs($this->admin);
    }

    private function vaccine(array $changes = []): array
    {
        return array_replace(['vaccine_name' => 'Vacuna de prueba', 'application_date' => '2026-10-01', 'next_dose_date' => '2026-10-15', 'practitioner_name' => 'Profesional ficticio'], $changes);
    }

    private function vaccination(array $changes = []): VaccinationDose
    {
        $this->post('/veterinaria/'.$this->animal->id.'/vaccinations', $this->vaccine($changes))->assertSessionHasNoErrors();

        return VaccinationDose::latest('id')->firstOrFail();
    }

    public function test_application_fulfills_exact_schedule_and_preserves_antecedent_without_automatic_next_dose(): void
    {
        $dose = $this->vaccination();
        $path = '/veterinaria/'.$this->animal->id.'/dosis/'.$dose->id.'/apply';
        $this->post($path, $this->vaccine(['application_date' => '2026-10-15', 'next_dose_date' => null, 'recorded_by' => 999, 'resolved_by' => 999]))->assertSessionHasNoErrors();
        $dose->refresh();
        $this->assertSame('Aplicada', $dose->status);
        $this->assertSame($this->admin->id, $dose->resolved_by);
        $this->assertSame($this->admin->id, $dose->application->recorded_by);
        $this->assertNotEquals($dose->source_vaccination_id, $dose->application_vaccination_id);
        $this->assertDatabaseCount('vaccinations', 2);
        $this->assertDatabaseCount('vaccination_doses', 1);
        $this->assertDatabaseHas('vaccinations', ['id' => $dose->source_vaccination_id, 'application_date' => '2026-10-01', 'next_dose_date' => '2026-10-15']);
        $this->get('/veterinaria/controles')->assertInertia(fn (Assert $p) => $p->where('doses.total', 0));
        $this->get('/veterinaria/controles?bucket=completed')->assertInertia(fn (Assert $p) => $p->where('doses.total', 1));
        $this->post($path, $this->vaccine(['next_dose_date' => null]))->assertSessionHasErrors('dose');
        $this->post(str_replace('/apply', '/cancel', $path), ['cancellation_reason' => 'Duplicado'])->assertSessionHasErrors('dose');
        $this->assertDatabaseCount('vaccinations', 2);
    }

    public function test_cancellation_requires_reason_and_keeps_source_and_resolution_audit(): void
    {
        $dose = $this->vaccination();
        $dose->legacy_unverified = true;
        $dose->save();
        $path = '/veterinaria/'.$this->animal->id.'/dosis/'.$dose->id.'/cancel';
        $this->post($path, [])->assertSessionHasErrors('cancellation_reason');
        $this->assertSame('Pendiente', $dose->fresh()->status);
        $this->post($path, ['cancellation_reason' => 'Programación duplicada revisada por el profesional.'])->assertSessionHasNoErrors();
        $this->assertSame('Cancelada', $dose->fresh()->status);
        $this->assertFalse($dose->fresh()->legacy_unverified);
        $this->assertDatabaseCount('vaccinations', 1);
        $this->get('/veterinaria/controles?bucket=cancelled')->assertInertia(fn (Assert $p) => $p->where('doses.total', 1));
        $this->get('/veterinaria/controles')->assertInertia(fn (Assert $p) => $p->where('doses.total', 0));
        $audit = HealthAudit::where('action', 'Cancelada')->sole();
        $this->assertSame('Pendiente', $audit->before_values['status']);
        $this->assertSame('Cancelada', $audit->after_values['status']);
        $this->assertSame($this->admin->id, $audit->actor_id);
    }

    public function test_schedule_corrections_are_audited_and_removal_or_resolved_date_changes_are_rejected(): void
    {
        $dose = $this->vaccination();
        $path = '/veterinaria/'.$this->animal->id.'/vaccinations/'.$dose->source_vaccination_id;
        $this->patch($path, $this->vaccine(['next_dose_date' => '2026-10-20']))->assertSessionHasNoErrors();
        $this->assertSame('2026-10-20', $dose->fresh()->scheduled_date->toDateString());
        $this->assertDatabaseHas('health_audits', ['action' => 'Reprogramación', 'record_id' => $dose->id]);
        $this->patch($path, $this->vaccine(['next_dose_date' => null]))->assertSessionHasErrors('next_dose_date');
        $this->post('/veterinaria/'.$this->animal->id.'/dosis/'.$dose->id.'/cancel', ['cancellation_reason' => 'Corregido'])->assertSessionHasNoErrors();
        $this->patch($path, $this->vaccine())->assertSessionHasErrors('next_dose_date');
        $this->assertDatabaseHas('vaccinations', ['id' => $dose->source_vaccination_id, 'next_dose_date' => '2026-10-20']);
    }

    public function test_corrections_of_each_record_preserve_creator_and_log_before_after_with_editor(): void
    {
        $colleague = User::factory()->create(['role' => 'admin', 'shelter_id' => $this->admin->shelter_id]);
        foreach ([
            'consultations' => ['consultation_date' => '2026-10-01', 'reason' => 'Ingreso', 'diagnosis' => 'Informe ficticio'],
            'vaccinations' => $this->vaccine(['next_dose_date' => null]),
            'treatments' => ['description' => 'Indicación ficticia', 'start_date' => '2026-10-01', 'status' => 'Activo'],
            'controls' => ['control_type' => 'Revisión', 'scheduled_date' => '2026-10-15', 'status' => 'Pendiente'],
        ] as $type => $data) {
            $url = '/veterinaria/'.$this->animal->id.'/'.$type;
            $this->actingAs($this->admin)->post($url, $data + ['recorded_by' => $colleague->id, 'updated_by' => $colleague->id])->assertSessionHasNoErrors();
            $record = $this->animal->{$type}()->sole();
            $this->actingAs($colleague)->patch($url.'/'.$record->id, $data + ['observations' => 'Corrección extensa '.str_repeat('detalle ', 100), 'recorded_by' => 999, 'updated_by' => 999])->assertSessionHasNoErrors();
            $this->assertSame($this->admin->id, $record->fresh()->recorded_by);
            $this->assertSame($colleague->id, $record->fresh()->updated_by);
            $audit = HealthAudit::where('record_type', $type)->where('action', 'Corrección')->sole();
            $this->assertSame($colleague->id, $audit->actor_id);
            $this->assertNull($audit->before_values['observations']);
            $this->assertStringStartsWith('Corrección extensa', $audit->after_values['observations']);
        }
    }

    public function test_audit_failure_rolls_back_correction_and_dose_application(): void
    {
        $dose = $this->vaccination();
        $count = HealthAudit::count();
        HealthAudit::saving(fn () => false);
        try {
            $this->patch('/veterinaria/'.$this->animal->id.'/vaccinations/'.$dose->source_vaccination_id, $this->vaccine(['vaccine_name' => 'No persistida']))->assertSessionHasErrors('record');
            $this->post('/veterinaria/'.$this->animal->id.'/dosis/'.$dose->id.'/apply', $this->vaccine(['next_dose_date' => null]))->assertSessionHasErrors('record');
            $this->assertDatabaseCount('vaccinations', 1);
            $this->assertSame('Vacuna de prueba', $dose->source->vaccine_name);
            $this->assertSame('Pendiente', $dose->fresh()->status);
            $this->assertSame($count, HealthAudit::count());
        } finally {
            HealthAudit::flushEventListeners();
        }
    }

    public function test_agenda_buckets_and_dashboard_include_boundaries_without_other_shelters(): void
    {
        foreach ([-1, 0, 1, 30, 31] as $offset) {
            $day = today()->addDays($offset)->toDateString();
            $this->vaccination(['next_dose_date' => $day]);
            $this->animal->controls()->create(['control_type' => 'Control', 'scheduled_date' => $day, 'status' => 'Pendiente', 'recorded_by' => $this->admin->id]);
        }
        foreach (['pending' => 4, 'overdue' => 1, 'today' => 1, 'upcoming' => 2, 'completed' => 0, 'cancelled' => 0, 'all' => 5] as $bucket => $count) {
            $this->get('/veterinaria/controles?bucket='.$bucket)->assertInertia(fn (Assert $p) => $p->where('doses.total', $count)->where('controls.total', $count));
        }
        $this->get('/admin')->assertInertia(fn (Assert $p) => $p->where('stats.Dosis pendientes hasta 30 días (incluye vencidas)', 4));
        $this->get('/veterinaria/controles?bucket=invalid')->assertSessionHasErrors('bucket');
        $this->animal->controls()->whereDate('scheduled_date', today())->update(['status' => 'Realizado']);
        $this->animal->controls()->whereDate('scheduled_date', today()->subDay())->update(['status' => 'Cancelado']);
        $this->get('/veterinaria/controles?bucket=completed')->assertInertia(fn (Assert $p) => $p->where('controls.total', 1));
        $this->get('/veterinaria/controles?bucket=cancelled')->assertInertia(fn (Assert $p) => $p->where('controls.total', 1));
    }

    public function test_archived_history_is_read_only_and_other_refuges_roles_and_public_cannot_access_it(): void
    {
        $dose = $this->vaccination();
        $this->animal->delete();
        $url = '/veterinaria/'.$this->animal->id;
        $this->get($url)->assertInertia(fn (Assert $p) => $p->where('readOnly', true)->has('animal.vaccinations', 1)->where('doses.total', 1)->where('audits.total', 2));
        $this->get('/veterinaria?archive=archived')->assertInertia(fn (Assert $p) => $p->where('animals.total', 1));
        $this->post($url.'/vaccinations', $this->vaccine())->assertNotFound();
        $this->patch($url.'/vaccinations/'.$dose->source_vaccination_id, $this->vaccine())->assertNotFound();
        $this->post($url.'/dosis/'.$dose->id.'/apply', $this->vaccine())->assertNotFound();
        $this->get('/animales/'.$this->animal->id)->assertNotFound();
        $other = Shelter::create(['name' => 'Norte', 'slug' => 'norte', 'active' => true]);
        $this->actingAs(User::factory()->create(['role' => 'admin', 'shelter_id' => $other->id]))->get($url)->assertNotFound();
        $this->get('/veterinaria/controles?bucket=all')->assertInertia(fn (Assert $p) => $p->where('doses.total', 0));
        foreach (['superadmin', 'adoptante'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))->get($url)->assertForbidden();
            $this->get('/veterinaria/controles')->assertForbidden();
        }
        $this->actingAs($this->admin);
        $this->admin->shelter->update(['active' => false]);
        $this->get($url)->assertForbidden();
    }

    public function test_dates_and_foreign_dose_ids_cannot_be_used_to_fabricate_applications(): void
    {
        $dose = $this->vaccination();
        $path = '/veterinaria/'.$this->animal->id.'/dosis/'.$dose->id.'/apply';
        foreach (['2026-10-16', '2026-09-30', 'invalid'] as $day) {
            $this->post($path, $this->vaccine(['application_date' => $day, 'next_dose_date' => null]))->assertSessionHasErrors('application_date');
        }
        $second = Animal::factory()->create(['shelter_id' => $this->admin->shelter_id]);
        $this->post('/veterinaria/'.$second->id.'/dosis/'.$dose->id.'/apply', $this->vaccine())->assertNotFound();
        $this->post('/veterinaria/'.$second->id.'/vaccinations', $this->vaccine(['next_dose_date' => '2026-09-30']))->assertSessionHasErrors('next_dose_date');
        $this->assertDatabaseCount('vaccinations', 1);
        $this->get('/animales/'.$this->animal->id)->assertInertia(fn (Assert $p) => $p->missing('animal.vaccinations')->missing('doses')->missing('audits'));
        $this->post('/veterinaria/'.$this->animal->id.'/controls', ['control_type' => 'Control', 'scheduled_date' => '2026-02-31', 'status' => 'Pendiente'])->assertSessionHasErrors('scheduled_date');
        $this->post('/veterinaria/'.$this->animal->id.'/treatments', ['description' => 'Tratamiento indicado', 'start_date' => '2026-10-01', 'estimated_end_date' => '2026-09-30', 'status' => 'Activo'])->assertSessionHasErrors('estimated_end_date');
    }

    public function test_foreign_clinical_records_and_audits_are_not_exposed_or_writable(): void
    {
        $dose = $this->vaccination();
        $other = Shelter::create(['name' => 'Norte', 'slug' => 'norte', 'active' => true]);
        $foreign = Animal::factory()->create(['shelter_id' => $other->id]);
        $staff = User::factory()->create(['role' => 'admin', 'shelter_id' => $other->id]);
        $this->actingAs($staff);
        $url = '/veterinaria/'.$this->animal->id;
        $this->post($url.'/vaccinations', $this->vaccine())->assertNotFound();
        $this->patch($url.'/vaccinations/'.$dose->source_vaccination_id, $this->vaccine())->assertNotFound();
        $this->post($url.'/dosis/'.$dose->id.'/cancel', ['cancellation_reason' => 'Intento ajeno'])->assertNotFound();
        $this->get($url.'?audit_page=1')->assertNotFound();
        $this->patch('/veterinaria/'.$foreign->id.'/vaccinations/'.$dose->source_vaccination_id, $this->vaccine())->assertNotFound();
        $this->get('/admin')->assertInertia(fn (Assert $p) => $p->where('stats.Dosis pendientes hasta 30 días (incluye vencidas)', 0));
        $this->assertDatabaseCount('vaccinations', 1);
        $this->assertDatabaseCount('health_audits', 2);
    }

    public function test_linked_application_dates_stay_consistent_when_correcting_existing_records(): void
    {
        $dose = $this->vaccination();
        $this->post('/veterinaria/'.$this->animal->id.'/dosis/'.$dose->id.'/apply', $this->vaccine(['application_date' => '2026-10-10', 'next_dose_date' => '2026-11-01']))->assertSessionHasNoErrors();
        $dose->refresh();
        $this->assertDatabaseCount('vaccination_doses', 2);
        $this->patch('/veterinaria/'.$this->animal->id.'/vaccinations/'.$dose->application_vaccination_id, $this->vaccine(['application_date' => '2026-09-01', 'next_dose_date' => '2026-11-01']))->assertSessionHasErrors('application_date');
        $this->patch('/veterinaria/'.$this->animal->id.'/vaccinations/'.$dose->source_vaccination_id, $this->vaccine(['application_date' => '2026-10-11']))->assertSessionHasErrors('application_date');
        $this->assertDatabaseHas('vaccinations', ['id' => $dose->application_vaccination_id, 'application_date' => '2026-10-10']);
    }
}
