<?php

namespace App\Models\Concerns;

use App\Models\Animal;
use Illuminate\Database\Eloquent\Builder;

trait ScopedToStaffShelter
{
    public static function bootScopedToStaffShelter(): void
    {
        static::addGlobalScope('staff_shelter', function (Builder $query) {
            // El catálogo público es de toda la red, también para personal autenticado.
            if ($query->getModel() instanceof Animal && request()->route()?->named('home', 'catalog', 'shelters.catalog', 'animals.show', 'shelters.animals.show')) {
                return;
            }
            $user = auth()->user();
            if ($user && $user->role === 'admin') {
                if ($query->getModel() instanceof Animal) {
                    $query->where($query->getModel()->qualifyColumn('shelter_id'), $user->shelter_id ?? 0);
                } else {
                    $query->whereHas('animal', fn (Builder $animal) => $animal->withTrashed()->where('shelter_id', $user->shelter_id ?? 0));
                }
            }
        });
    }
}
