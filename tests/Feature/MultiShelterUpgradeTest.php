<?php

namespace Tests\Feature;

use App\Models\Shelter;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MultiShelterUpgradeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // TestCase verifica que solo se use memoria o una base terminada en _testing.
        // Las reconstrucciones SQLite de tablas referenciadas requieren no tener una transacción abierta.
        $this->artisan('migrate:fresh')->assertExitCode(0);
    }

    protected function tearDown(): void
    {
        RefreshDatabaseState::$migrated = false;
        parent::tearDown();
    }

    public function test_upgrade_preserves_legacy_records_and_assigns_the_initial_shelter(): void
    {
        $migration = require database_path('migrations/2026_10_14_000002_add_multi_shelter_support.php');
        $roles = require database_path('migrations/2026_10_14_000003_simplify_roles_and_clinical_authorship.php');
        $roles->down();
        $migration->down();
        Schema::table('users', fn (Blueprint $t) => $t->enum('role', ['adoptante', 'admin', 'veterinario'])->default('adoptante')->change());
        $staff = DB::table('users')->insertGetId(['name' => 'Equipo previo', 'last_name' => '', 'email' => 'legacy@example.test', 'password' => Hash::make('clave-inicial-123'), 'role' => 'admin']);
        $animal = DB::table('animals')->insertGetId(['name' => 'Mora previa', 'species' => 'Gato', 'sex' => 'Hembra', 'size' => 'Pequeño', 'color' => 'Negro', 'description' => 'Historia conservada', 'entry_date' => today(), 'availability_status' => 'Disponible']);
        $archived = DB::table('animals')->insertGetId(['name' => 'Animal archivado', 'species' => 'Perro', 'sex' => 'Macho', 'size' => 'Mediano', 'color' => 'Blanco', 'description' => 'Historia archivada', 'entry_date' => today(), 'availability_status' => 'Adoptado', 'deleted_at' => now()]);
        $adopter = DB::table('users')->insertGetId(['name' => 'Familia previa', 'last_name' => '', 'email' => 'legacy-adopter@example.test', 'password' => Hash::make('clave-inicial-123'), 'role' => 'adoptante']);
        $request = DB::table('adoption_requests')->insertGetId(['user_id' => $adopter, 'animal_id' => $archived, 'phone' => '1155551234', 'address' => 'Calle 123', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Experiencia previa', 'motivation' => 'Hogar responsable', 'status' => 'Adoptado']);
        DB::table('adoptions')->insert(['adoption_request_id' => $request, 'animal_id' => $archived, 'user_id' => $adopter, 'adoption_date' => today(), 'registered_by' => $staff]);
        DB::table('adoption_request_history')->insert(['adoption_request_id' => $request, 'changed_by' => $staff, 'previous_status' => 'Aprobada', 'new_status' => 'Adoptado', 'observations' => 'Historia anterior conservada']);
        DB::table('animal_photos')->insert(['animal_id' => $archived, 'file_path' => 'animals/legacy.jpg', 'is_primary' => true]);
        $migration->up();
        $roles->up();
        $initial = Shelter::where('slug', 'huella-inicial')->firstOrFail();
        $this->assertDatabaseHas('users', ['id' => $staff, 'shelter_id' => $initial->id, 'role' => 'admin']);
        $this->assertDatabaseHas('animals', ['id' => $animal, 'name' => 'Mora previa', 'shelter_id' => $initial->id]);
        $this->assertDatabaseHas('animals', ['id' => $archived, 'shelter_id' => $initial->id]);
        $this->assertDatabaseHas('users', ['id' => $adopter, 'shelter_id' => null, 'role' => 'adoptante']);
        $this->assertDatabaseHas('adoption_requests', ['id' => $request, 'animal_id' => $archived, 'status' => 'Adoptado']);
        $this->assertDatabaseHas('adoptions', ['adoption_request_id' => $request, 'animal_id' => $archived]);
        $this->assertDatabaseHas('adoption_request_history', ['adoption_request_id' => $request, 'observations' => 'Historia anterior conservada']);
        $this->assertDatabaseHas('animal_photos', ['animal_id' => $archived, 'file_path' => 'animals/legacy.jpg']);
    }

    public function test_role_simplification_preserves_clinical_records_and_credentials(): void
    {
        $migration = require database_path('migrations/2026_10_14_000003_simplify_roles_and_clinical_authorship.php');
        $migration->down();
        $shelter = Shelter::where('slug', 'huella-inicial')->firstOrFail();
        $password = Hash::make('password-test-123');
        $vet = DB::table('users')->insertGetId(['name' => 'Ana', 'last_name' => 'Pérez', 'email' => 'legacy-vet@example.test', 'password' => $password, 'role' => 'veterinario', 'shelter_id' => $shelter->id]);
        $animal = DB::table('animals')->insertGetId(['shelter_id' => $shelter->id, 'name' => 'Mora', 'species' => 'Gato', 'sex' => 'Hembra', 'size' => 'Pequeño', 'color' => 'Negro', 'description' => 'Historia conservada', 'entry_date' => today(), 'availability_status' => 'Disponible']);
        $records = [
            'medical_consultations' => ['consultation_date' => today(), 'reason' => 'Consulta', 'diagnosis' => 'Informe anterior'],
            'vaccinations' => ['vaccine_name' => 'Vacuna anterior', 'application_date' => today()],
            'treatments' => ['description' => 'Indicación anterior', 'start_date' => today(), 'status' => 'Activo'],
            'veterinary_controls' => ['control_type' => 'Revisión', 'scheduled_date' => today(), 'status' => 'Pendiente'],
        ];
        foreach ($records as $table => $data) {
            DB::table($table)->insert($data + ['animal_id' => $animal, 'veterinarian_id' => $vet]);
        }
        $migration->up();
        $this->assertDatabaseHas('users', ['id' => $vet, 'role' => 'admin', 'shelter_id' => $shelter->id, 'password' => $password]);
        foreach ($records as $table => $data) {
            $this->assertDatabaseHas($table, ['animal_id' => $animal, 'recorded_by' => $vet, 'practitioner_name' => 'Ana Pérez']);
            $this->assertDatabaseCount($table, 1);
        }
    }
}
