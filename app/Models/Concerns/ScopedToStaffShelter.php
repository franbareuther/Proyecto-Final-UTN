<?php

namespace App\Models\Concerns;

use App\Models\Animal;
use Illuminate\Database\Eloquent\Builder;

trait ScopedToStaffShelter
{
    public static function bootScopedToStaffShelter(): void
    {
        static::addGlobalScope('staff_shelter', function (Builder $query) {
            $user = auth()->user();
            if ($user && in_array($user->role, ['admin', 'veterinario'], true)) {
                if ($query->getModel() instanceof Animal) {
                    $query->where($query->getModel()->qualifyColumn('shelter_id'), $user->shelter_id ?? 0);
                } else {
                    $query->whereHas('animal', fn (Builder $animal) => $animal->withTrashed()->where('shelter_id', $user->shelter_id ?? 0));
                }
            }
        });
    }
}
