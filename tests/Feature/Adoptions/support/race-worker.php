<?php

use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use App\Services\AdoptionService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

// Independent PHP process used only by ConcurrentAdoptionsTest on an opted-in disposable database.
require dirname(__DIR__, 4).'/vendor/autoload.php';
$app = require dirname(__DIR__, 4).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (getenv('HUELLA_CONCURRENCY') !== '1' || config('database.default') !== 'mysql' || ! preg_match('/^huella_e2_[a-z0-9_]+_testing$/', config('database.connections.mysql.database'))) {
    throw new RuntimeException('Concurrency workers require a dedicated opted-in testing database.');
}
$spec = json_decode(file_get_contents($argv[1]), true, flags: JSON_THROW_ON_ERROR);
$waitFor = function (string $file): void {
    $deadline = microtime(true) + 10;
    while (! file_exists($file)) {
        if (microtime(true) > $deadline) {
            throw new RuntimeException('Race barrier timed out.');
        }
        usleep(10000);
    }
};
$connectionId = DB::selectOne('SELECT CONNECTION_ID() AS id')->id;
$execute = function () use ($spec): void {
    $service = app(AdoptionService::class);
    $actor = User::findOrFail($spec['actor']);
    if ($spec['action'] === 'submit') {
        $service->submit(Animal::findOrFail($spec['animal']), $actor, [
            'phone' => '0000000000', 'address' => 'Domicilio de prueba', 'housing_type' => 'Casa',
            'has_other_pets' => false, 'previous_experience' => 'Prueba', 'motivation' => 'Solicitud ficticia para prueba concurrente.',
        ]);
    } elseif ($spec['action'] === 'deactivate') {
        Shelter::findOrFail($spec['shelter'])->update(['active' => false]);
    } else {
        $service->transition(AdoptionRequest::findOrFail($spec['request']), $actor, $spec['action'], 'Decisión de prueba concurrente.');
    }
};
$started = microtime(true);
try {
    if ($spec['holder']) {
        DB::transaction(function () use ($spec, $waitFor, $execute): void {
            if ($spec['action'] === 'deactivate') {
                Shelter::whereKey($spec['shelter'])->lockForUpdate()->firstOrFail();
            } else {
                Animal::whereKey($spec['animal'])->lockForUpdate()->firstOrFail();
            }
            touch($spec['barrier'].'/locked');
            $waitFor($spec['barrier'].'/attempting');
            // Keep the lock while the independent connection attempts its service operation.
            usleep(700000);
            $execute();
        });
    } else {
        $waitFor($spec['barrier'].'/locked');
        $started = microtime(true);
        touch($spec['barrier'].'/attempting');
        $execute();
    }
    $result = 'success';
} catch (ValidationException $error) {
    $result = 'validation';
}
echo json_encode(['result' => $result, 'connection' => $connectionId, 'elapsed' => microtime(true) - $started]);
