<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAdoptionRequest;
use App\Models\Adoption;
use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Services\AdoptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdoptionRequestController extends Controller
{
    public function create(Animal $animal)
    {
        if ($animal->availability_status !== 'Disponible') {
            return to_route('animals.show', $animal)->with('error', 'Este animal ya no recibe nuevas solicitudes. Podés consultar su estado en el perfil.');
        }

        return Inertia::render('Adoptante/Apply', ['animal' => $animal->load('photos')]);
    }

    public function store(StoreAdoptionRequest $r, Animal $animal, AdoptionService $service)
    {
        $application = $service->submit($animal, $r->user(), $r->validated());

        return to_route('requests.show', $application)->with('success', 'Recibimos tu solicitud. Podés seguirla desde tu cuenta.');
    }

    public function mine(Request $r)
    {
        return Inertia::render('Adoptante/Requests', ['requests' => $r->user()->adoptionRequests()->with('animal.photos')->latest()->paginate(10)]);
    }

    public function show(AdoptionRequest $adoptionRequest)
    {
        Gate::authorize('view', $adoptionRequest);

        return Inertia::render('Adoptante/RequestDetail', ['application' => $adoptionRequest->load(['animal.photos', 'user:id,name,last_name,email', 'history'])]);
    }

    public function index(Request $r)
    {
        $f = $r->validate(['q' => 'nullable|string|max:100', 'status' => ['nullable', Rule::in(['Nueva', 'En revisión', 'Aprobada', 'Rechazada', 'Adoptado'])]]);
        $q = AdoptionRequest::with(['animal.photos', 'user:id,name,last_name,email']);
        if ($r->filled('status')) {
            $q->where('status', $f['status']);
        }
        if ($r->filled('q')) {
            $q->where(fn ($q) => $q->whereHas('animal', fn ($a) => $a->where('name', 'like', '%'.$f['q'].'%'))->orWhereHas('user', fn ($u) => $u->where('name', 'like', '%'.$f['q'].'%')->orWhere('last_name', 'like', '%'.$f['q'].'%')->orWhere('email', 'like', '%'.$f['q'].'%')));
        }

        return Inertia::render('Admin/Requests', ['requests' => $q->latest()->paginate(15)->withQueryString(), 'filters' => $f]);
    }

    public function update(Request $r, AdoptionRequest $adoptionRequest, AdoptionService $service)
    {
        Gate::authorize('update', $adoptionRequest);
        $data = $r->validate(['status' => ['required', Rule::in(['En revisión', 'Aprobada', 'Rechazada', 'Adoptado'])], 'observations' => 'required|string|min:5|max:2000']);
        $service->transition($adoptionRequest, $r->user(), $data['status'], $data['observations']);

        return back()->with('success', 'Cambio registrado en el historial.');
    }

    public function adoptions()
    {
        return Inertia::render('Admin/Adoptions', ['adoptions' => Adoption::with(['animal.photos', 'user:id,name,last_name'])->latest()->paginate(15)]);
    }
}
