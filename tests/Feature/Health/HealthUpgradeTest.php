<?php

namespace Tests\Feature\Health;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use App\Models\VaccinationDose;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HealthUpgradeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh')->assertExitCode(0);
        Storage::fake('public');
    }

    protected function tearDown(): void
    {
        RefreshDatabaseState::$migrated = false;
        parent::tearDown();
    }

    public function test_upgrade_preserves_prior_records_and_never_invents_historical_applications_or_accounts(): void
    {
        $migration = require database_path('migrations/2026_10_15_000003_add_health_agenda_and_audits.php');
        $migration->down(); // Isolated test DB only, recreate the prior schema with synthetic records.
        $shelter = Shelter::firstOrFail();
        $shelter->forceFill(['image_path' => 'shelters/prior.png', 'image_type' => 'logo'])->save();
        $staff = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $animal = Animal::factory()->create(['shelter_id' => $shelter->id]);
        $animal->photos()->create(['file_path' => 'animals/prior.jpg', 'is_primary' => true]);
        foreach ([today()->subYear()->toDateString(), today()->addDay()->toDateString(), null] as $day) {
            $animal->vaccinations()->create(['vaccine_name' => 'Antecedente', 'application_date' => today()->subYears(2), 'next_dose_date' => $day, 'recorded_by' => $staff->id, 'practitioner_name' => 'Profesional previo']);
        }
        $animal->delete();
        $tables = ['users', 'shelters', 'animals', 'animal_photos', 'vaccinations'];
        $before = collect($tables)->mapWithKeys(fn ($table) => [$table => DB::table($table)->orderBy('id')->get()->toJson()])->all();
        $migration->up();
        $after = collect($tables)->mapWithKeys(fn ($table) => [$table => DB::table($table)->orderBy('id')->get()->toJson()])->all();
        $this->assertSame($before, $after);
        $this->assertDatabaseCount('vaccination_doses', 2);
        foreach (VaccinationDose::all() as $dose) {
            $this->assertTrue($dose->legacy_unverified);
            $this->assertSame('Pendiente', $dose->status);
            $this->assertNull($dose->resolved_at);
            $this->assertNull($dose->application_vaccination_id);
            $this->assertSame($animal->id, $dose->animal_id);
        }
        $this->assertDatabaseCount('health_audits', 0);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_explicit_superadmin_command_and_demo_use_current_roles_on_clean_install(): void
    {
        $this->assertDatabaseCount('users', 0);
        $this->artisan('shelter:create-staff')
            ->expectsQuestion('Nombre', 'Persona')->expectsQuestion('Apellido', 'Prueba')
            ->expectsQuestion('Correo electrónico', 'superadmin@huella.test')
            ->expectsChoice('Rol', 'superadmin', ['superadmin', 'admin'])
            ->expectsQuestion('Contraseña (mínimo 12 caracteres)', 'una-clave-ficticia-123')
            ->assertExitCode(0);
        $this->assertDatabaseHas('users', ['email' => 'superadmin@huella.test', 'role' => 'superadmin', 'shelter_id' => null]);
        config(['shelter.demo_password' => 'una-clave-ficticia-123']);
        $this->artisan('db:seed', ['--class' => 'DemoSeeder'])->assertExitCode(0);
        $this->assertDatabaseCount('users', 3);
        $this->assertDatabaseHas('users', ['email' => 'admin@huella.test', 'role' => 'admin']);
        $this->assertDatabaseMissing('users', ['role' => 'veterinario']);
        $this->assertDatabaseCount('vaccination_doses', 5);
        $this->artisan('db:seed', ['--class' => 'DemoSeeder'])->assertExitCode(0);
        $this->assertDatabaseCount('vaccination_doses', 5);
    }
}
