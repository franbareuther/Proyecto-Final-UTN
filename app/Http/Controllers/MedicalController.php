<?php

namespace App\Http\Controllers;

use App\Http\Requests\MedicalRequest;
use App\Models\Animal;
use App\Models\Vaccination;
use App\Models\VeterinaryControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class MedicalController extends Controller
{
    public function index(Request $r)
    {
        $f = $r->validate(['q' => 'nullable|string|max:100']);

        return Inertia::render('Veterinaria/Index', ['animals' => Animal::with('photos')->when($r->filled('q'), fn ($q) => $q->where('name', 'like', '%'.$f['q'].'%'))->orderBy('name')->paginate(15)->withQueryString(), 'filters' => $f]);
    }

    public function show(Animal $animal)
    {
        Gate::authorize('medical', $animal);

        return Inertia::render('Veterinaria/History', ['animal' => $animal->load(['photos', 'consultations.recorder:id,name,last_name', 'vaccinations.recorder:id,name,last_name', 'treatments.recorder:id,name,last_name', 'controls.recorder:id,name,last_name'])]);
    }

    public function store(MedicalRequest $r, Animal $animal, string $type)
    {
        Gate::authorize('medical', $animal);
        $animal->{$type}()->create($r->validated() + ['recorded_by' => $r->user()->id]);

        return back()->with('success', 'Registro sanitario guardado.');
    }

    public function update(MedicalRequest $r, Animal $animal, string $type, int $record)
    {
        Gate::authorize('medical', $animal);
        $entry = $animal->{$type}()->findOrFail($record);
        $entry->update($r->validated() + ['updated_by' => $r->user()->id]);

        return back()->with('success', 'Registro sanitario actualizado.');
    }

    public function controls()
    {
        return Inertia::render('Veterinaria/Controls', [
            'controls' => VeterinaryControl::with('animal.photos')->where('status', 'Pendiente')->orderBy('scheduled_date')->paginate(20),
            'vaccinations' => Vaccination::with('animal.photos')->whereNotNull('next_dose_date')->whereDate('next_dose_date', '<=', today()->addDays(30))->orderBy('next_dose_date')->get(),
            'today' => today()->toDateString(),
        ]);
    }
}
