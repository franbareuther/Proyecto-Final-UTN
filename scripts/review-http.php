<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Models\User;
use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Recorrido HTTP local: no reemplaza una revisión visual ni ejecuta migraciones/seeders.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (! app()->environment('local')) {
    fwrite(STDERR, "Este recorrido solo se permite en APP_ENV=local.\n");
    exit(1);
}
$base = rtrim(getenv('REVIEW_BASE_URL') ?: config('app.url'), '/');
if (! in_array(parse_url($base, PHP_URL_HOST), ['localhost', '127.0.0.1', '::1', '[::1]'], true)) {
    fwrite(STDERR, "REVIEW_BASE_URL debe apuntar a una dirección local.\n");
    exit(1);
}

function domainSnapshot(): array
{
    $result = [];
    foreach (['users', 'animals', 'animal_photos', 'adoption_requests', 'adoptions', 'adoption_request_history', 'medical_consultations', 'vaccinations', 'treatments', 'veterinary_controls'] as $table) {
        $result[$table] = (array) DB::table($table)->selectRaw('COUNT(*) AS total, MAX(id) AS last_id, MAX(updated_at) AS last_update')->first();
        $digest = hash_init('sha256');
        foreach (DB::table($table)->orderBy('id')->cursor() as $row) {
            hash_update($digest, json_encode($row, JSON_THROW_ON_ERROR));
        }
        $result[$table]['digest'] = hash_final($digest);
    }

    return $result;
}

function checkPage(Client $client, string $path, string $component): array
{
    $version = app(HandleInertiaRequests::class)->version(Request::create('/'));
    $response = $client->get($path, ['headers' => ['X-Inertia' => 'true', 'X-Inertia-Version' => $version ?? '', 'Accept' => 'text/html']]);
    $page = json_decode((string) $response->getBody(), true);
    if ($response->getStatusCode() !== 200 || ($page['component'] ?? null) !== $component) {
        throw new RuntimeException('Respuesta inesperada: '.$path.' (HTTP '.$response->getStatusCode().').');
    }
    echo 'OK '.$path.' -> '.$component.PHP_EOL;

    return $page['props'];
}

try {
    $before = domainSnapshot();
    $animals = Animal::with('photos')->get();
    $client = new Client(['base_uri' => $base, 'cookies' => new CookieJar, 'http_errors' => false, 'timeout' => 15]);
    foreach (['/' => 'Public/Home', '/animales' => 'Public/Catalog', '/animales?page=2' => 'Public/Catalog', '/login' => 'Auth/Login', '/register' => 'Auth/Register', '/forgot-password' => 'Auth/ForgotPassword', '/reset-password/revision-local' => 'Auth/ResetPassword'] as $path => $component) {
        checkPage($client, $path, $component);
    }
    foreach ($animals as $animal) {
        $props = checkPage($client, '/animales/'.$animal->id, 'Public/Animal');
        if (isset($props['animal']['consultations']) || isset($props['animal']['requests'])) {
            throw new RuntimeException('Relación privada incluida en perfil público.');
        }
        $photo = $client->get($animal->photo_url);
        if ($photo->getStatusCode() !== 200 || ! str_starts_with($photo->getHeaderLine('Content-Type'), 'image/')) {
            throw new RuntimeException('Fotografía no disponible para animal #'.$animal->id);
        }
    }
    $filtered = checkPage($client, '/animales?species=Gato&size=Peque%C3%B1o&age=young', 'Public/Catalog');
    foreach ($filtered['animals']['data'] as $animal) {
        if ($animal['species'] !== 'Gato' || $animal['size'] !== 'Pequeño') {
            throw new RuntimeException('El filtro no coincide con los registros.');
        }
    }
    $empty = checkPage($client, '/animales?q=revision-sin-resultados-92874', 'Public/Catalog');
    if ($empty['animals']['total'] !== 0) {
        throw new RuntimeException('No se pudo comprobar el catálogo vacío.');
    }

    $password = config('shelter.demo_password');
    if (! $password) {
        throw new RuntimeException('Falta DEMO_PASSWORD local para comprobar los roles; no se crearán cuentas.');
    }
    foreach (['adoptante', 'admin', 'veterinario'] as $role) {
        $user = User::where('email', $role.'@huella.test')->firstOrFail();
        $jar = new CookieJar;
        $client = new Client(['base_uri' => $base, 'cookies' => $jar, 'http_errors' => false, 'timeout' => 15]);
        $client->get('/login');
        $csrf = $jar->getCookieByName('XSRF-TOKEN');
        $client->post('/login', ['headers' => ['X-XSRF-TOKEN' => rawurldecode($csrf->getValue())], 'form_params' => ['email' => $user->email, 'password' => $password]]);
        $profile = checkPage($client, '/profile', 'Profile/Edit');
        if (($profile['auth']['user']['role'] ?? null) !== $role) {
            throw new RuntimeException('El login no inició la sesión esperada.');
        }
        checkPage($client, '/confirm-password', 'Auth/ConfirmPassword');
        if ($role === 'adoptante') {
            checkPage($client, '/mis-solicitudes', 'Adoptante/Requests');
            foreach (AdoptionRequest::where('user_id', $user->id)->get() as $application) {
                checkPage($client, '/solicitudes/'.$application->id, 'Adoptante/RequestDetail');
            }
            $available = $animals->firstWhere('availability_status', 'Disponible');
            if ($available) {
                checkPage($client, '/animales/'.$available->id.'/solicitar', 'Adoptante/Apply');
            }
            $unavailable = $animals->first(fn ($a) => $a->availability_status !== 'Disponible');
            if ($unavailable) {
                $p = checkPage($client, '/animales/'.$unavailable->id.'/solicitar', 'Public/Animal');
                if (empty($p['flash']['error'])) {
                    throw new RuntimeException('Falta el motivo del regreso al perfil.');
                }
            }
        }
        if ($role === 'admin') {
            foreach (['/admin' => 'Admin/Dashboard', '/admin/animales' => 'Admin/Animals', '/admin/animales/create' => 'Admin/AnimalForm', '/admin/solicitudes' => 'Admin/Requests', '/admin/adopciones' => 'Admin/Adoptions'] as $path => $component) {
                checkPage($client, $path, $component);
            }
            foreach ($animals as $animal) {
                checkPage($client, '/admin/animales/'.$animal->id.'/edit', 'Admin/AnimalForm');
            }
            foreach (AdoptionRequest::all() as $application) {
                checkPage($client, '/solicitudes/'.$application->id, 'Adoptante/RequestDetail');
            }
        }
        if ($role !== 'adoptante') {
            checkPage($client, '/veterinaria', 'Veterinaria/Index');
            checkPage($client, '/veterinaria/controles', 'Veterinaria/Controls');
            foreach ($animals as $animal) {
                checkPage($client, '/veterinaria/'.$animal->id, 'Veterinaria/History');
            }
            $searchPath = $role === 'admin' ? '/admin/solicitudes' : '/veterinaria';
            $invalid = $client->get($searchPath.'?q='.str_repeat('x', 101), ['allow_redirects' => false, 'headers' => ['Referer' => $base.$searchPath]]);
            if ($invalid->getStatusCode() !== 302) {
                throw new RuntimeException('La búsqueda inválida no devolvió validación.');
            }
            $p = checkPage($client, $searchPath, $role === 'admin' ? 'Admin/Requests' : 'Veterinaria/Index');
            if (empty($p['errors']['q'])) {
                throw new RuntimeException('No llegó el error de búsqueda a Inertia.');
            }
        }
        $forbidden = match ($role) {
            'adoptante' => ['/admin', '/admin/animales', '/admin/solicitudes', '/veterinaria', '/veterinaria/controles'],
            'veterinario' => ['/admin', '/admin/animales', '/admin/solicitudes', '/mis-solicitudes'],
            default => ['/mis-solicitudes'],
        };
        foreach ($forbidden as $path) {
            if ($client->get($path)->getStatusCode() !== 403) {
                throw new RuntimeException('Falla de autorización: '.$role.' en '.$path);
            }
            echo 'OK '.$role.' sin acceso a '.$path.' (403)'.PHP_EOL;
        }
        $csrf = $jar->getCookieByName('XSRF-TOKEN');
        $client->post('/logout', ['headers' => ['X-XSRF-TOKEN' => rawurldecode($csrf->getValue())]]);
        $p = checkPage($client, '/', 'Public/Home');
        if ($p['auth']['user'] !== null) {
            throw new RuntimeException('El logout no cerró la sesión.');
        }
    }
    if ($before !== domainSnapshot()) {
        throw new RuntimeException('Se detectaron diferencias en los contadores de datos del dominio durante el recorrido.');
    }
    echo 'OK filas del dominio conservadas (conteos, IDs, fechas y SHA-256); sin migraciones ni seeders.'.PHP_EOL;
    echo 'Recorrido HTTP completo. No se ejecutó navegador, JavaScript ni comprobación visual.'.PHP_EOL;
} catch (Throwable $e) {
    fwrite(STDERR, $e->getMessage().PHP_EOL);
    exit(1);
}
