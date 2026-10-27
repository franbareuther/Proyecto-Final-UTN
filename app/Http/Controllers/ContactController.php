<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ContactController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:254'],
            'subject' => ['required', Rule::in(['Consulta general', 'Sumar mi refugio', 'Ayuda con la plataforma', 'Propuesta de colaboración'])],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ]);

        DB::table('contact_messages')->insert([
            ...$data,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->to(route('home').'#contacto');
    }
}
