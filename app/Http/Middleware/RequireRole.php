<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        abort_unless($request->user() && in_array($request->user()->role, $roles, true), 403);

        if (in_array($request->user()->role, ['admin', 'veterinario'], true)) {
            if ($request->user()->shelter?->active !== true) {
                return Inertia::render('Errors/ShelterInactive')->toResponse($request)->setStatusCode(403);
            }
        }

        return $next($request);
    }
}
