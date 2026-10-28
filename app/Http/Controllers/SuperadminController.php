<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Models\HealthAudit;
use App\Models\Shelter;
use App\Models\Treatment;
use App\Models\VaccinationDose;
use App\Models\VeterinaryControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SuperadminController extends Controller
{
    public function dashboard(): Response
    {
        return Inertia::render('Superadmin/Dashboard', [
            'stats' => [
                ['label' => 'Refugios activos', 'value' => Shelter::where('active', true)->count(), 'href' => '/superadmin/refugios'],
                ['label' => 'Animales registrados', 'value' => Animal::withTrashed()->count(), 'href' => '/superadmin/animales'],
                ['label' => 'Disponibles para adoptar', 'value' => Animal::where('availability_status', 'Disponible')->count(), 'href' => '/superadmin/animales?status=Disponible&archive=active'],
                ['label' => 'Solicitudes por revisar', 'value' => AdoptionRequest::whereIn('status', ['Nueva', 'En revisión'])->count(), 'href' => '/superadmin/solicitudes?period=pending'],
                ['label' => 'Adopciones realizadas', 'value' => Adoption::count(), 'href' => '/superadmin/adopciones'],
                ['label' => 'Animales en tratamiento', 'value' => Treatment::where('status', 'Activo')->whereHas('animal', fn ($q) => $q->whereNull('deleted_at'))->distinct()->count('animal_id'), 'href' => '/superadmin/animales?treatment=active&archive=active'],
                ['label' => 'Controles vencidos', 'value' => VeterinaryControl::where('status', 'Pendiente')->whereDate('scheduled_date', '<', today())->count(), 'href' => '/superadmin/controles?period=overdue'],
                ['label' => 'Dosis vencidas', 'value' => VaccinationDose::where('status', 'Pendiente')->whereDate('scheduled_date', '<', today())->count(), 'href' => '/superadmin/dosis?period=overdue'],
                ['label' => 'Mensajes recibidos', 'value' => DB::table('contact_messages')->count(), 'href' => '/superadmin/mensajes'],
            ],
            'shelters' => Shelter::withCount(['animals', 'animals as available_count' => fn ($q) => $q->where('availability_status', 'Disponible'), 'staff'])->orderBy('name')->get(),
            'species' => Animal::selectRaw('species as label, COUNT(*) as total')->groupBy('species')->get(),
            'statuses' => AdoptionRequest::selectRaw('status as label, COUNT(*) as total')->groupBy('status')->get(),
        ]);
    }

    public function index(Request $request, string $view): Response
    {
        $statuses = match ($view) {
            'animales' => ['Disponible', 'En proceso de adopción', 'Adoptado', 'No disponible temporalmente'],
            'solicitudes' => ['Nueva', 'En revisión', 'Aprobada', 'Rechazada', 'Adoptado'],
            'controles' => ['Pendiente', 'Realizado', 'Cancelado'],
            'dosis' => ['Pendiente', 'Aplicada', 'Cancelada'],
            default => [],
        };
        $filters = $request->validate([
            'q' => 'nullable|string|max:100', 'shelter' => ['nullable', 'integer', 'exists:shelters,id'],
            'status' => ['nullable', Rule::in($statuses)], 'archive' => 'nullable|in:active,archived,all',
            'period' => 'nullable|in:all,pending,overdue,today,upcoming', 'treatment' => 'nullable|in:active',
        ]);
        $query = match ($view) {
            'animales' => Animal::withTrashed()->with(['photos', 'shelter']),
            'solicitudes' => AdoptionRequest::with(['animal.photos', 'animal.shelter', 'user:id,name,last_name']),
            'adopciones' => Adoption::with(['animal.photos', 'animal.shelter', 'user:id,name,last_name']),
            'controles' => VeterinaryControl::with(['animal.photos', 'animal.shelter']),
            'dosis' => VaccinationDose::with(['animal.photos', 'animal.shelter', 'source']),
        };
        if ($request->filled('shelter')) {
            $view === 'animales'
                ? $query->where('shelter_id', $filters['shelter'])
                : $query->whereHas('animal', fn ($q) => $q->where('shelter_id', $filters['shelter']));
        }
        if ($request->filled('q')) {
            $term = '%'.$filters['q'].'%';
            if ($view === 'animales') {
                $query->where('name', 'like', $term);
            } else {
                $query->where(function ($q) use ($term, $view) {
                    $q->whereHas('animal', fn ($a) => $a->where('name', 'like', $term));
                    if (in_array($view, ['solicitudes', 'adopciones'])) {
                        $q->orWhereHas('user', fn ($u) => $u->where('name', 'like', $term)->orWhere('last_name', 'like', $term));
                    }
                });
            }
        }
        if ($request->filled('status')) {
            $query->where($view === 'animales' ? 'availability_status' : 'status', $filters['status']);
        }
        if ($view === 'animales') {
            if (($filters['archive'] ?? '') === 'active') {
                $query->whereNull('deleted_at');
            }
            if (($filters['archive'] ?? '') === 'archived') {
                $query->onlyTrashed();
            }
            if (($filters['treatment'] ?? '') === 'active') {
                $query->whereHas('treatments', fn ($q) => $q->where('status', 'Activo'));
            }
        }
        $period = $filters['period'] ?? 'all';
        if ($view === 'solicitudes' && $period === 'pending') {
            $query->whereIn('status', ['Nueva', 'En revisión']);
        }
        if (in_array($view, ['controles', 'dosis']) && $period !== 'all') {
            $query->where('status', 'Pendiente');
            match ($period) {
                'overdue' => $query->whereDate('scheduled_date', '<', today()),
                'today' => $query->whereDate('scheduled_date', today()),
                'upcoming' => $query->whereDate('scheduled_date', '>', today())->whereDate('scheduled_date', '<=', today()->addDays(30)),
                default => $query,
            };
        }
        if ($view === 'animales') {
            $query->orderBy('name')->orderBy('id');
        } elseif (in_array($view, ['controles', 'dosis'])) {
            $query->orderBy('scheduled_date')->orderBy('id');
        } else {
            $query->latest('id');
        }

        $records = $query->paginate(15)->withQueryString()->through(function ($record) use ($view) {
            $animal = $view === 'animales' ? $record : $record->animal;

            return [
                'id' => $record->id, 'animal' => $animal->name, 'photo_url' => $animal->photo_url,
                'shelter' => $animal->shelter?->name, 'archived' => $animal->trashed(),
                'status' => $view === 'animales' ? $animal->availability_status : ($record->status ?? 'Adoptado'),
                'detail' => match ($view) {
                    'animales' => $animal->species.' · '.$animal->size.' · '.($animal->breed ?: 'Sin raza especificada'),
                    'solicitudes', 'adopciones' => trim($record->user->name.' '.$record->user->last_name),
                    'controles' => $record->control_type,
                    'dosis' => $record->source?->vaccine_name ?? 'Vacunación',
                },
                'date' => match ($view) {
                    'animales' => $animal->entry_date?->format('Y-m-d'),
                    'solicitudes' => $record->created_at->toDateString(),
                    'adopciones' => $record->adoption_date,
                    default => substr((string) $record->scheduled_date, 0, 10),
                },
                'href' => $view === 'solicitudes' ? '/superadmin/solicitudes/'.$record->id : '/superadmin/animales/'.$animal->id.'/historia',
            ];
        });

        return Inertia::render('Superadmin/Network', [
            'view' => $view, 'records' => $records, 'filters' => $filters, 'statuses' => $statuses,
            'shelters' => Shelter::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function history(Animal $animal): Response
    {
        return Inertia::render('Veterinaria/History', [
            'animal' => $animal->load(['shelter', 'photos', 'consultations.recorder:id,name,last_name', 'vaccinations.recorder:id,name,last_name', 'treatments.recorder:id,name,last_name', 'controls.recorder:id,name,last_name', 'consultations.updater:id,name,last_name', 'vaccinations.updater:id,name,last_name', 'treatments.updater:id,name,last_name', 'controls.updater:id,name,last_name']),
            'readOnly' => true,
            'doses' => VaccinationDose::with(['source', 'application', 'resolver:id,name,last_name'])->where('animal_id', $animal->id)->orderByDesc('scheduled_date')->orderByDesc('id')->paginate(20, ['*'], 'dose_page')->withQueryString(),
            'audits' => HealthAudit::with('actor:id,name,last_name')->where('animal_id', $animal->id)->latest('id')->paginate(20, ['*'], 'audit_page')->withQueryString(),
        ]);
    }

    public function application(AdoptionRequest $adoptionRequest): Response
    {
        return Inertia::render('Adoptante/RequestDetail', [
            'application' => $adoptionRequest->load(['animal.photos', 'animal.shelter', 'user:id,name,last_name,email', 'history']),
        ]);
    }
}
