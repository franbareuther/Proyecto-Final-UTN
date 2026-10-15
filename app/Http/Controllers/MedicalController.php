<?php

namespace App\Http\Controllers;

use App\Http\Requests\MedicalRequest;
use App\Models\Animal;
use App\Models\HealthAudit;
use App\Models\VaccinationDose;
use App\Models\VeterinaryControl;
use App\Services\HealthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class MedicalController extends Controller
{
    public function index(Request $r)
    {
        $f = $r->validate(['q' => 'nullable|string|max:100', 'archive' => 'nullable|in:active,archived,all']);
        $query = Animal::with('photos');
        if (($f['archive'] ?? '') === 'archived') {
            $query->onlyTrashed();
        } elseif (($f['archive'] ?? '') === 'all') {
            $query->withTrashed();
        }

        return Inertia::render('Veterinaria/Index', ['animals' => $query->when($r->filled('q'), fn ($q) => $q->where('name', 'like', '%'.$f['q'].'%'))->orderBy('name')->orderBy('id')->paginate(15)->withQueryString(), 'filters' => $f]);
    }

    public function show(Animal $animal)
    {
        Gate::authorize('medical', $animal);

        return Inertia::render('Veterinaria/History', [
            'animal' => $animal->load(['photos', 'consultations.recorder:id,name,last_name', 'vaccinations.recorder:id,name,last_name', 'treatments.recorder:id,name,last_name', 'controls.recorder:id,name,last_name',
                'consultations.updater:id,name,last_name', 'vaccinations.updater:id,name,last_name', 'treatments.updater:id,name,last_name', 'controls.updater:id,name,last_name']),
            'readOnly' => $animal->trashed(),
            'doses' => VaccinationDose::with(['source', 'application', 'resolver:id,name,last_name'])->where('animal_id', $animal->id)->orderByDesc('scheduled_date')->orderByDesc('id')->paginate(20, ['*'], 'dose_page')->withQueryString(),
            'audits' => HealthAudit::with('actor:id,name,last_name')->where('animal_id', $animal->id)->latest('id')->paginate(20, ['*'], 'audit_page')->withQueryString(),
        ]);
    }

    public function store(MedicalRequest $r, Animal $animal, string $type, HealthService $service)
    {
        Gate::authorize('medical', $animal);
        $service->save($animal, $r->user(), $type, $r->validated());

        return back()->with('success', 'Registro sanitario guardado.');
    }

    public function update(MedicalRequest $r, Animal $animal, string $type, int $record, HealthService $service)
    {
        Gate::authorize('medical', $animal);
        $service->save($animal, $r->user(), $type, $r->validated(), $record);

        return back()->with('success', 'Registro sanitario actualizado.');
    }

    public function resolveDose(Request $r, Animal $animal, int $dose, string $action, HealthService $service)
    {
        Gate::authorize('medical', $animal);
        abort_unless(in_array($action, ['apply', 'cancel'], true), 404);
        $data = $action === 'apply'
            ? $r->validate((new MedicalRequest)->vaccinationRules() + ['practitioner_name' => 'nullable|string|max:255', 'observations' => 'nullable|string|max:5000'], (new MedicalRequest)->messages())
            : $r->validate(['cancellation_reason' => 'required|string|max:5000'], ['cancellation_reason.required' => 'Indicá el motivo de cancelación.']);
        $service->resolve($animal, $r->user(), $dose, $action, $data);

        return back()->with('success', $action === 'apply' ? 'Aplicación registrada; el pendiente quedó cumplido.' : 'Dosis cancelada. El antecedente y el motivo se conservan.');
    }

    private function agendaFilter($query, string $field, string $bucket, string $completed): void
    {
        match ($bucket) {
            'completed' => $query->where('status', $completed),
            'cancelled' => $query->where('status', $completed === 'Aplicada' ? 'Cancelada' : 'Cancelado'),
            'overdue' => $query->where('status', 'Pendiente')->whereDate($field, '<', today()),
            'today' => $query->where('status', 'Pendiente')->whereDate($field, today()),
            'upcoming' => $query->where('status', 'Pendiente')->whereDate($field, '>', today())->whereDate($field, '<=', today()->addDays(30)),
            'all' => $query,
            default => $query->where('status', 'Pendiente')->whereDate($field, '<=', today()->addDays(30)),
        };
    }

    public function controls(Request $request)
    {
        $filters = $request->validate(['bucket' => 'nullable|in:pending,overdue,today,upcoming,completed,cancelled,all']);
        $bucket = $filters['bucket'] ?? 'pending';
        $controls = VeterinaryControl::with('animal.photos');
        $doses = VaccinationDose::with(['animal.photos', 'source', 'application']);
        $this->agendaFilter($controls, 'scheduled_date', $bucket, 'Realizado');
        $this->agendaFilter($doses, 'scheduled_date', $bucket, 'Aplicada');
        $dosePage = $doses->orderBy('scheduled_date')->orderBy('id')->paginate(20, ['*'], 'dose_page')->withQueryString();

        return Inertia::render('Veterinaria/Controls', [
            'controls' => $controls->orderBy('scheduled_date')->orderBy('id')->paginate(20)->withQueryString(),
            'doses' => $dosePage, 'filters' => $filters,
            'vaccinations' => collect($dosePage->items())->map(fn ($dose) => $dose->source),
            'today' => today()->toDateString(),
        ]);
    }
}
