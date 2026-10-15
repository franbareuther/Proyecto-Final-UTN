<?php

namespace Tests\Feature\Adoptions;

use App\Models\Adoption;
use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use App\Services\AdoptionService;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class ConcurrentAdoptionsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (getenv('HUELLA_CONCURRENCY') !== '1') {
            $this->markTestSkipped('Opt-in: requires an independent disposable MariaDB/MySQL service.');
        }
        $this->assertSame('mysql', config('database.default'));
        $this->assertMatchesRegularExpression('/^huella_e2_[a-z0-9_]+_testing$/', config('database.connections.mysql.database'));
        Artisan::call('migrate', ['--force' => true]);
    }

    private function fixture(): array
    {
        $shelter = Shelter::create(['name' => 'Refugio de carrera', 'slug' => 'race-'.bin2hex(random_bytes(6)), 'active' => true]);
        $animal = Animal::factory()->create(['shelter_id' => $shelter->id]);
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $adopter = User::factory()->create(['role' => 'adoptante']);

        return [$shelter, $animal, $admin, $adopter];
    }

    private function submit(Animal $animal, User $adopter): AdoptionRequest
    {
        return app(AdoptionService::class)->submit($animal, $adopter, ['phone' => '0000000000', 'address' => 'Prueba', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Prueba', 'motivation' => 'Solicitud ficticia para verificar carreras.']);
    }

    private function race(array $first, array $second): array
    {
        $barrier = storage_path('framework/testing/e2-race-'.bin2hex(random_bytes(8)));
        mkdir($barrier, 0777, true);
        $connection = config('database.connections.mysql');
        $env = ['APP_ENV' => 'testing', 'HUELLA_CONCURRENCY' => '1', 'APP_KEY' => config('app.key'),
            'DB_CONNECTION' => 'mysql', 'DB_HOST' => $connection['host'], 'DB_PORT' => (string) $connection['port'],
            'DB_DATABASE' => $connection['database'], 'DB_USERNAME' => $connection['username'], 'DB_PASSWORD' => $connection['password'] ?? '', 'DB_URL' => '',
            'CACHE_STORE' => 'array', 'MAIL_MAILER' => 'array', 'SESSION_DRIVER' => 'array'];
        $processes = [];
        foreach ([$first, $second] as $index => $spec) {
            $path = $barrier.'/'.$index.'.json';
            file_put_contents($path, json_encode($spec + ['holder' => $index === 0, 'barrier' => $barrier]));
            $process = new Process([PHP_BINARY, __DIR__.'/support/race-worker.php', $path], base_path(), $env, timeout: 20);
            $process->start();
            $processes[] = $process;
        }
        try {
            $results = [];
            foreach ($processes as $process) {
                $process->wait();
                $this->assertTrue($process->isSuccessful(), $process->getErrorOutput());
                $results[] = json_decode($process->getOutput(), true, flags: JSON_THROW_ON_ERROR);
            }
            $this->assertNotSame($results[0]['connection'], $results[1]['connection']);
            $this->assertGreaterThan(0.4, $results[1]['elapsed'], 'The contender must actually wait on the held database lock.');
            $this->assertSame(['success', 'validation'], array_column($results, 'result'));
            file_put_contents($barrier.'/results.json', json_encode($results));

            return $results;
        } finally {
            foreach ($processes as $process) {
                if ($process->isRunning()) {
                    $process->stop();
                }
            }
        }
    }

    public function test_duplicate_submissions_use_independent_connections(): void
    {
        [, $animal, , $adopter] = $this->fixture();
        $spec = ['action' => 'submit', 'animal' => $animal->id, 'actor' => $adopter->id];
        $this->race($spec, $spec);
        $this->assertSame(1, $animal->requests()->count());
        $this->assertSame(1, $animal->requests()->firstOrFail()->history()->count());
    }

    public function test_two_approvals_have_only_one_winner(): void
    {
        [, $animal, $admin, $adopter] = $this->fixture();
        $a = $this->submit($animal, $adopter);
        $b = $this->submit($animal, User::factory()->create());
        $spec = ['action' => 'Aprobada', 'animal' => $animal->id, 'actor' => $admin->id];
        $this->race($spec + ['request' => $a->id], $spec + ['request' => $b->id]);
        $this->assertSame(1, $animal->requests()->where('status', 'Aprobada')->count());
        $this->assertSame('En proceso de adopción', $animal->fresh()->availability_status);
        $this->assertSame(2, $a->history()->count());
        $this->assertSame(1, $b->history()->count());
        $this->assertSame(0, $animal->adoption()->count());
    }

    public function test_double_registration_creates_only_one_adoption_and_one_closure(): void
    {
        [, $animal, $admin, $adopter] = $this->fixture();
        $a = $this->submit($animal, $adopter);
        $other = $this->submit($animal, User::factory()->create());
        app(AdoptionService::class)->transition($a, $admin, 'Aprobada', 'Reserva de prueba.');
        $spec = ['action' => 'Adoptado', 'animal' => $animal->id, 'actor' => $admin->id, 'request' => $a->id];
        $this->race($spec, $spec);
        $this->assertSame(1, Adoption::where('animal_id', $animal->id)->count());
        $this->assertSame('Adoptado', $animal->fresh()->availability_status);
        $this->assertSame('Rechazada', $other->fresh()->status);
        $this->assertSame(3, $a->history()->count());
        $this->assertSame(2, $other->history()->count());
        $this->assertStringContainsString('otra familia', $other->history()->reorder('id', 'desc')->first()->observations);
    }

    public function test_deactivation_prevents_a_waiting_submission(): void
    {
        [$shelter, $animal, $admin, $adopter] = $this->fixture();
        $this->race(['action' => 'deactivate', 'shelter' => $shelter->id, 'actor' => $admin->id],
            ['action' => 'submit', 'animal' => $animal->id, 'actor' => $adopter->id]);
        $this->assertFalse($shelter->fresh()->active);
        $this->assertSame(0, $animal->requests()->count());
    }
}
