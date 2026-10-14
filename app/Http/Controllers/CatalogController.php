<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\Shelter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CatalogController extends Controller
{
    public function home()
    {
        return Inertia::render('Public/Home', ['animals' => Animal::with(['photos', 'shelter'])->whereHas('shelter', fn ($q) => $q->where('active', true))->where('availability_status', 'Disponible')->latest()->take(6)->get(), 'refuges' => Shelter::where('active', true)->orderBy('name')->take(3)->get(['id', 'name', 'slug', 'city'])]);
    }

    public function all(Request $r)
    {
        return $this->index($r);
    }

    public function index(Request $r, ?Shelter $shelter = null)
    {
        if ($shelter) {
            abort_unless($shelter->active, 404);
        }
        $f = $r->validate(['q' => 'nullable|string|max:100', 'species' => 'nullable|string|max:100', 'breed' => 'nullable|string|max:100', 'size' => 'nullable|string|max:30', 'age' => 'nullable|in:young,adult,senior', 'status' => 'nullable|in:Disponible,En proceso de adopción,Adoptado,No disponible temporalmente', 'shelter' => 'nullable|string|max:100', 'city' => 'nullable|string|max:100']);
        $base = Animal::whereHas('shelter', fn ($q) => $q->where('active', true));
        if ($shelter) {
            $base->where('shelter_id', $shelter->id);
        } else {
            if ($r->filled('shelter')) {
                $base->whereHas('shelter', fn ($q) => $q->where('slug', $f['shelter']));
            }
            if ($r->filled('city')) {
                $base->whereHas('shelter', fn ($q) => $q->where('city', $f['city']));
            }
        }
        $breeds = (clone $base)->whereNotNull('breed')->distinct()->orderBy('breed')->pluck('breed');
        $q = $base->with(['photos', 'shelter']);
        if ($r->filled('q')) {
            $q->where('name', 'like', '%'.$f['q'].'%');
        }
        foreach (['species', 'breed', 'size'] as $field) {
            if ($r->filled($field)) {
                $q->where($field, $f[$field]);
            }
        }
        if ($r->filled('status')) {
            $q->where('availability_status', $f['status']);
        }
        if ($r->filled('age')) {
            [$min,$max] = match ($f['age']) {
                'young' => [0, 11],'adult' => [12, 95],default => [96, 600]
            };
            $q->where(function ($a) use ($min, $max) {
                $a->where(function ($b) use ($min, $max) {
                    $b->whereNull('birth_date')->whereBetween('estimated_age', [$min, $max]);
                })
                    ->orWhere(function ($b) use ($min, $max) {
                        $b->where('birth_date', '<=', today()->subMonths($min))->where('birth_date', '>', today()->subMonths($max + 1));
                    });
            });
        }

        return Inertia::render('Public/Catalog', ['animals' => $q->latest()->paginate(12)->withQueryString(), 'filters' => $f, 'shelter' => $shelter, 'catalogUrl' => $shelter ? route('shelters.catalog', $shelter) : route('catalog'), 'breeds' => $breeds, 'refuges' => $shelter ? [] : Shelter::where('active', true)->orderBy('name')->get(['id', 'name', 'slug']), 'cities' => $shelter ? [] : Shelter::where('active', true)->whereNotNull('city')->where('city', '!=', '')->distinct()->orderBy('city')->pluck('city')]);
    }

    public function scopedShow(Shelter $shelter, Animal $animal)
    {
        abort_unless($shelter->id === $animal->shelter_id, 404);

        return $this->show($animal);
    }

    public function show(Animal $animal)
    {
        abort_unless($animal->shelter?->active, 404);

        return Inertia::render('Public/Animal', ['animal' => $animal->load(['photos', 'shelter']), 'shelter' => $animal->shelter]);
    }
}
