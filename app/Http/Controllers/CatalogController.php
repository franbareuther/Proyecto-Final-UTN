<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CatalogController extends Controller
{
    public function home()
    {
        return Inertia::render('Public/Home', ['animals' => Animal::with('photos')->where('availability_status', 'Disponible')->latest()->take(3)->get()]);
    }

    public function index(Request $r)
    {
        $f = $r->validate(['q' => 'nullable|string|max:100', 'species' => 'nullable|string|max:100', 'breed' => 'nullable|string|max:100', 'size' => 'nullable|string|max:30', 'age' => 'nullable|in:young,adult,senior', 'status' => 'nullable|in:Disponible,En proceso de adopción,Adoptado,No disponible temporalmente']);
        $q = Animal::with('photos');
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

        return Inertia::render('Public/Catalog', ['animals' => $q->latest()->paginate(12)->withQueryString(), 'filters' => $f, 'breeds' => Animal::whereNotNull('breed')->distinct()->orderBy('breed')->pluck('breed')]);
    }

    public function show(Animal $animal)
    {
        return Inertia::render('Public/Animal', ['animal' => $animal->load('photos')]);
    }
}
