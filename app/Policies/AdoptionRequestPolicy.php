<?php

namespace App\Policies;

use App\Models\AdoptionRequest;
use App\Models\User;

class AdoptionRequestPolicy
{
    public function view(User $user, AdoptionRequest $request): bool
    {
        return ($user->role === 'admin' && $user->belongsToShelter($request->animal->shelter_id)) || $request->user_id === $user->id;
    }

    public function update(User $user, AdoptionRequest $request): bool
    {
        return $user->role === 'admin' && $user->belongsToShelter($request->animal->shelter_id);
    }
}
