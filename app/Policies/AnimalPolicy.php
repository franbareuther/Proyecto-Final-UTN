<?php

namespace App\Policies;

use App\Models\Animal;
use App\Models\User;

class AnimalPolicy
{
    public function create(User $u): bool
    {
        return $u->role === 'admin';
    }

    public function update(User $u, Animal $a): bool
    {
        return $u->role === 'admin';
    }

    public function delete(User $u, Animal $a): bool
    {
        return $u->role === 'admin';
    }

    public function medical(User $u, Animal $a): bool
    {
        return in_array($u->role, ['admin', 'veterinario'], true);
    }
}
