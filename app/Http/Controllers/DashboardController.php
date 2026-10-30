<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Models\Treatment;
use App\Models\VaccinationDose;
use App\Models\VeterinaryControl;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $months = collect(range(5, 0))->map(function ($offset) {
            $date = today()->startOfMonth()->subMonths($offset);

            return ['label' => $date->format('m/Y'), 'total' => Adoption::whereBetween('adoption_date', [$date->toDateString(), $date->copy()->endOfMonth()->toDateString()])->count()];
        });

        return Inertia::render('Admin/Dashboard', [
            // RequireRole ya garantiza un refugio activo; el nombre siempre proviene de la base.
            'shelter' => $request->user()->shelter?->only(['id', 'name', 'slug', 'city']),
            'stats' => [
                'Animales registrados' => Animal::count(), 'Disponibles' => Animal::where('availability_status', 'Disponible')->count(),
                'Adopciones realizadas' => Adoption::count(), 'Solicitudes pendientes' => AdoptionRequest::whereIn('status', ['Nueva', 'En revisión'])->count(),
                'Animales en tratamiento' => Treatment::where('status', 'Activo')->distinct()->count('animal_id'),
                'Controles en 30 días' => VeterinaryControl::where('status', 'Pendiente')->whereBetween('scheduled_date', [today(), today()->addDays(30)])->count(),
                'Dosis pendientes hasta 30 días (incluye vencidas)' => VaccinationDose::where('status', 'Pendiente')->whereDate('scheduled_date', '<=', today()->addDays(30))->count(),
            ],
            'species' => Animal::selectRaw('species as label, COUNT(*) as total')->groupBy('species')->get(),
            'statuses' => AdoptionRequest::selectRaw('status as label, COUNT(*) as total')->groupBy('status')->get(),
            'months' => $months,
            'recentRequests' => AdoptionRequest::with(['animal.photos', 'animal.shelter', 'user:id,name,last_name'])->latest()->take(5)->get(),
            'recentAdoptions' => Adoption::with(['animal.photos', 'animal.shelter', 'user:id,name,last_name'])->latest()->take(5)->get(),
            'controls' => VeterinaryControl::with('animal.photos', 'animal.shelter')->where('status', 'Pendiente')->orderBy('scheduled_date')->take(5)->get(),
        ]);
    }
}
