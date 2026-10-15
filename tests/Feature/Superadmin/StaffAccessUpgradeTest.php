<?php

namespace Tests\Feature\Superadmin;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Tests\TestCase;

class StaffAccessUpgradeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Isolated testing database only. DDL must run outside a transaction on MySQL.
        $this->artisan('migrate:fresh')->assertExitCode(0);
    }

    protected function tearDown(): void
    {
        RefreshDatabaseState::$migrated = false;
        parent::tearDown();
    }

    public function test_access_migration_preserves_preexisting_records_credentials_and_photo_relations(): void
    {
        $migration = require database_path('migrations/2026_10_15_000002_add_staff_access_controls.php');
        $migration->down();
        $shelter = Shelter::create(['name' => 'Sur previo', 'slug' => 'sur', 'active' => true, 'image_path' => 'shelters/prior.png', 'image_type' => 'logo']);
        $shelter->forceFill(['image_path' => 'shelters/prior.png'])->save();
        $staff = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $animal = Animal::factory()->create(['shelter_id' => $shelter->id]);
        $photo = $animal->photos()->create(['file_path' => 'animals/prior.jpg', 'is_primary' => true]);
        $control = $animal->controls()->create(['control_type' => 'Previo', 'scheduled_date' => today(), 'status' => 'Pendiente', 'recorded_by' => $staff->id]);
        $migration->up();
        $this->assertDatabaseHas('users', ['id' => $staff->id, 'password' => $staff->password, 'shelter_id' => $shelter->id, 'suspended_at' => null, 'access_version' => 0]);
        $this->assertDatabaseHas('animal_photos', ['id' => $photo->id, 'animal_id' => $animal->id, 'file_path' => 'animals/prior.jpg']);
        $this->assertDatabaseHas('shelters', ['id' => $shelter->id, 'image_path' => 'shelters/prior.png', 'image_type' => 'logo']);
        $this->assertDatabaseHas('veterinary_controls', ['id' => $control->id, 'recorded_by' => $staff->id, 'animal_id' => $animal->id]);
        $this->assertDatabaseHas('animals', ['id' => $animal->id, 'shelter_id' => $shelter->id]);
    }
}
