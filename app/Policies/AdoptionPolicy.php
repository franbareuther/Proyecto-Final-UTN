<?php

namespace App\Policies;

use App\Models\Adoption;
use App\Models\User;

class AdoptionPolicy
{
    /** El seguimiento es privado entre la familia adoptante y el refugio responsable. */
    public function followUp(User $user, Adoption $adoption): bool
    {
        return $this->owner($user, $adoption) || $this->review($user, $adoption);
    }

    public function submit(User $user, Adoption $adoption): bool
    {
        return $this->owner($user, $adoption);
    }

    public function review(User $user, Adoption $adoption): bool
    {
        return $user->role === 'admin' && $user->belongsToShelter($adoption->animal->shelter_id);
    }

    private function owner(User $user, Adoption $adoption): bool
    {
        return $user->role === 'adoptante' && $adoption->user_id === $user->id;
    }
}
