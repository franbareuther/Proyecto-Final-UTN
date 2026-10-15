<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureStaffAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if ($user?->role === 'admin') {
            $user = $user->fresh();
            if (! $user) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login');
            }
            Auth::guard('web')->setUser($user);
            $version = (int) $user->access_version;
            $sessionVersion = $request->session()->get('staff_access_version');
            // Legacy sessions remain usable until the first explicit access revocation.
            if (! $user->isSuspended() && ($sessionVersion === $version || ($sessionVersion === null && $version === 0))) {
                $request->session()->put('staff_access_version', $version);
            } else {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->with('status', 'Tu acceso cambió o fue suspendido. Consultá al responsable de Huella o ingresá nuevamente si ya fue reactivado.');
            }
        }

        return $next($request);
    }
}
