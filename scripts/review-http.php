<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Local, read-only domain review. Authentication creates sessions, not domain fixtures.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$base = rtrim(getenv('REVIEW_BASE_URL') ?: config('app.url'), '/');
if (! app()->environment('local') || ! in_array(parse_url($base, PHP_URL_HOST), ['localhost', '127.0.0.1', '::1', '[::1]'], true)) {
    throw new RuntimeException('Solo se permite APP_ENV=local y REVIEW_BASE_URL local.');
}

function domainSnapshot(): array
{
    $result = [];
    foreach (['users', 'shelters', 'animals', 'animal_photos', 'adoption_requests', 'adoptions', 'adoption_request_history', 'medical_consultations', 'vaccinations', 'treatments', 'veterinary_controls', 'vaccination_doses', 'health_audits'] as $table) {
        $digest = hash_init('sha256');
        foreach (DB::table($table)->orderBy('id')->cursor() as $row) {
            hash_update($digest, json_encode($row, JSON_THROW_ON_ERROR));
        }
        $result[$table] = hash_final($digest);
    }

    return $result;
}

function checkPage(Client $client, string $path, string $component): array
{
    $version = app(HandleInertiaRequests::class)->version(Request::create('/'));
    $response = $client->get($path, ['headers' => ['X-Inertia' => 'true', 'X-Inertia-Version' => $version ?? '', 'Accept' => 'text/html']]);
    $page = json_decode((string) $response->getBody(), true);
    if ($response->getStatusCode() !== 200 || ($page['component'] ?? null) !== $component) {
        throw new RuntimeException('Respuesta inesperada '.$path.' (HTTP '.$response->getStatusCode().').');
    }
    echo 'OK '.$path.' -> '.$component.PHP_EOL;

    return $page['props'];
}

try {
    $before = domainSnapshot();
    $options = ['base_uri' => $base, 'cookies' => new CookieJar, 'http_errors' => false, 'timeout' => 20, 'allow_redirects' => false];
    $client = new Client($options);
    foreach (['/' => 'Public/Home', '/animales' => 'Public/Catalog', '/refugios' => 'Public/Shelters', '/login' => 'Auth/Login'] as $path => $page) {
        checkPage($client, $path, $page);
    }
    foreach (Shelter::where('active', true)->get() as $shelter) {
        checkPage($client, '/refugios/'.$shelter->slug, 'Public/Shelter');
        checkPage($client, '/refugios/'.$shelter->slug.'/animales', 'Public/Catalog');
        foreach (Animal::where('shelter_id', $shelter->id)->with('photos')->get() as $animal) {
            foreach (['/animales/'.$animal->id, '/refugios/'.$shelter->slug.'/animales/'.$animal->id] as $path) {
                $props = checkPage($client, $path, 'Public/Animal');
                foreach (['consultations', 'vaccinations', 'treatments', 'controls', 'requests', 'audits', 'doses'] as $private) {
                    if (array_key_exists($private, $props['animal'])) {
                        throw new RuntimeException('Relación privada en catálogo.');
                    }
                }
            }
            $image = $client->get($animal->photo_url);
            if ($image->getStatusCode() !== 200 || ! str_starts_with($image->getHeaderLine('Content-Type'), 'image/')) {
                throw new RuntimeException('Imagen de animal inaccesible.');
            }
        }
        if ($shelter->image_url && $client->get($shelter->image_url)->getStatusCode() !== 200) {
            throw new RuntimeException('Imagen de refugio inaccesible.');
        }
    }
    $empty = checkPage($client, '/animales?q=revision-sin-resultados-92874', 'Public/Catalog');
    if ($empty['animals']['total'] !== 0) {
        throw new RuntimeException('Resultado vacío inesperado.');
    }
    $password = getenv('REVIEW_PASSWORD') ?: config('shelter.demo_password');
    if (! $password) {
        throw new RuntimeException('Falta REVIEW_PASSWORD o DEMO_PASSWORD para cuentas ficticias existentes.');
    }
    foreach (['superadmin', 'admin', 'adoptante'] as $role) {
        $email = getenv('REVIEW_'.strtoupper($role).'_EMAIL') ?: $role.'@huella.test';
        $user = User::where('email', $email)->where('role', $role)->firstOrFail();
        $jar = new CookieJar;
        $client = new Client(array_replace($options, ['cookies' => $jar]));
        $client->get('/login');
        $client->post('/login', ['headers' => ['X-XSRF-TOKEN' => rawurldecode($jar->getCookieByName('XSRF-TOKEN')->getValue())], 'form_params' => ['email' => $email, 'password' => $password]]);
        $profile = checkPage($client, '/profile', 'Profile/Edit');
        if (($profile['auth']['user']['id'] ?? null) !== $user->id) {
            throw new RuntimeException('Identidad autenticada inesperada.');
        }
        checkPage($client, '/animales', 'Public/Catalog');
        checkPage($client, '/refugios', 'Public/Shelters');
        if ($role === 'superadmin') {
            checkPage($client, '/superadmin/refugios', 'Superadmin/Shelters');
        } elseif ($role === 'adoptante') {
            checkPage($client, '/mis-solicitudes', 'Adoptante/Requests');
        } else {
            foreach (['/admin' => 'Admin/Dashboard', '/admin/refugio' => 'Admin/ShelterProfile', '/veterinaria' => 'Veterinaria/Index', '/veterinaria/controles' => 'Veterinaria/Controls'] as $path => $page) {
                checkPage($client, $path, $page);
            }
            foreach (Animal::withTrashed()->where('shelter_id', $user->shelter_id)->get() as $animal) {
                checkPage($client, '/veterinaria/'.$animal->id, 'Veterinaria/History');
            }
        }
        foreach ($role === 'admin' ? ['/superadmin/refugios', '/mis-solicitudes'] : ($role === 'superadmin' ? ['/admin', '/veterinaria', '/mis-solicitudes'] : ['/admin', '/veterinaria', '/superadmin/refugios']) as $path) {
            if ($client->get($path)->getStatusCode() !== 403) {
                throw new RuntimeException('Falla de permisos '.$role.' '.$path);
            }
        }
        // Discard this cookie jar. Logout can rotate remember tokens and is not domain-read-only.
    }
    if ($before !== domainSnapshot()) {
        throw new RuntimeException('El dominio cambió durante el recorrido; revisar antes de seguir.');
    }
    echo 'OK SHA-256 de todas las tablas de dominio conservado. Sin migraciones, seeders ni escrituras clínicas.'.PHP_EOL;
    echo 'HTTP no acredita navegador, JavaScript, dispositivos ni revisión visual.'.PHP_EOL;
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage().PHP_EOL);
    exit(1);
}
