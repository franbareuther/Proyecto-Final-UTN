<?php

namespace App\Policies;

use App\Models\Animal;
use App\Models\User;

class AnimalPolicy
{
    public function create(User $u): bool
    {
        return $u->role === 'admin' && ! $u->isSuspended() && $u->shelter?->active === true;
    }

    public function update(User $u, Animal $a): bool
    {
        return $u->role === 'admin' && $u->belongsToShelter($a->shelter_id);
    }

    public function delete(User $u, Animal $a): bool
    {
        return $u->role === 'admin' && $u->belongsToShelter($a->shelter_id);
    }

    public function medical(User $u, Animal $a): bool
    {
        return $u->role === 'admin' && $u->belongsToShelter($a->shelter_id);
    }
}
