<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Superadmin/Messages', [
            'messages' => DB::table('contact_messages')
                ->select('id', 'name', 'email', 'phone', 'subject', 'message', 'created_at')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->paginate(15)
                ->through(function ($message) {
                    $message->created_at = Carbon::parse($message->created_at)->toIso8601String();

                    return $message;
                }),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:254'],
            'phone' => ['required', 'string', 'max:32', 'regex:/^\+?[0-9 ().-]+$/', 'regex:/^(?:\D*\d){7,15}\D*$/'],
            'subject' => ['required', Rule::in(['Consulta general', 'Sumar mi refugio', 'Ayuda con la plataforma', 'Propuesta de colaboración'])],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ], [
            'phone.required' => 'Ingresá tu número de teléfono.',
            'phone.regex' => 'Ingresá un teléfono válido, con entre 7 y 15 dígitos. Podés incluir el código de país y de área.',
            'phone.max' => 'El teléfono no puede superar los 32 caracteres.',
        ]);

        DB::table('contact_messages')->insert([
            ...$data,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->to(route('home').'#contacto');
    }
}
