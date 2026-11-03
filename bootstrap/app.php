<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RequireRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['role' => RequireRole::class]);
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Páginas de error con la identidad de Huellita. Las respuestas JSON (chat) se mantienen.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            $status = $response->getStatusCode();
            if ($request->expectsJson()) {
                return $response;
            }
            if ($status === 419) {
                return back()->with('error', 'La página estuvo inactiva demasiado tiempo. Revisá los datos e intentá nuevamente.');
            }
            // En desarrollo se conserva el detalle técnico de los errores del servidor.
            $friendly = in_array($status, [403, 404, 429, 503], true) || ($status === 500 && ! config('app.debug'));
            if (! $friendly) {
                return $response;
            }
            try {
                $user = $request->user();
            } catch (Throwable) {
                $user = null;
            }

            // Una ruta inexistente no pasa por el middleware de Inertia: se envían los datos que necesita el diseño.
            return Inertia::render('Errors/Error', [
                'status' => $status,
                'auth' => ['user' => $user],
                'flash' => [],
                'shelterName' => config('shelter.brand'),
                'currentShelter' => null,
            ])->toResponse($request)->setStatusCode($status);
        });
    })->create();
