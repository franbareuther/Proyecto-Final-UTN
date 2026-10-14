<?php

namespace App\Console\Commands;

use App\Models\Shelter;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CreateStaff extends Command
{
    protected $signature = 'shelter:create-staff';

    protected $description = 'Crear una cuenta de superadministrador o administrador de refugio';

    public function handle(): int
    {
        $data = ['name' => $this->ask('Nombre'), 'last_name' => $this->ask('Apellido'), 'email' => strtolower($this->ask('Correo electrónico')), 'role' => $this->choice('Rol', ['superadmin', 'admin']), 'password' => $this->secret('Contraseña (mínimo 12 caracteres)')];
        $v = Validator::make($data, ['name' => 'required|string|max:255', 'last_name' => 'required|string|max:255', 'email' => 'required|email|max:255|unique:users', 'role' => ['required', Rule::in(['superadmin', 'admin'])], 'password' => 'required|string|min:12']);
        if ($v->fails()) {
            foreach ($v->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }
        $u = new User(collect($data)->except('role')->all());
        $u->role = $data['role'];
        $u->password = Hash::make($data['password']);
        if ($u->role !== 'superadmin') {
            $slug = $this->ask('Slug del refugio activo');
            $shelter = Shelter::where('slug', $slug)->where('active', true)->first();
            if (! $shelter) {
                $this->error('Refugio activo no encontrado.');

                return self::FAILURE;
            }
            $u->shelter_id = $shelter->id;
        }
        $u->save();
        $this->info('Cuenta creada.');

        return self::SUCCESS;
    }
}
