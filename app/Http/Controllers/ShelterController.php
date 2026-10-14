<?php

namespace App\Http\Controllers;

use App\Models\Shelter;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ShelterController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['q' => 'nullable|string|max:100']);

        return Inertia::render('Public/Shelters', [
            'shelters' => Shelter::where('active', true)->when($filters['q'] ?? null, fn ($q, $term) => $q->where(fn ($q) => $q->where('name', 'like', '%'.$term.'%')->orWhere('city', 'like', '%'.$term.'%')))->orderBy('name')->paginate(12)->withQueryString(),
            'filters' => $filters,
        ]);
    }

    public function show(Shelter $shelter)
    {
        abort_unless($shelter->active, 404);

        return Inertia::render('Public/Shelter', ['shelter' => $shelter]);
    }

    public function manage()
    {
        return Inertia::render('Superadmin/Shelters', [
            'shelters' => Shelter::with(['staff' => fn ($q) => $q->select('id', 'shelter_id', 'name', 'last_name', 'email', 'role')])->orderBy('name')->get(),
        ]);
    }

    private function rules(?Shelter $shelter = null): array
    {
        return [
            'name' => 'required|string|max:100', 'slug' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('shelters')->ignore($shelter?->id)],
            'description' => 'nullable|string|max:5000', 'city' => 'nullable|string|max:100', 'address' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255', 'phone' => 'nullable|string|max:50', 'active' => 'required|boolean',
        ];
    }

    public function store(Request $request)
    {
        Shelter::create($request->validate($this->rules()));

        return back()->with('success', 'Refugio creado. Ahora podés asignar su administrador.');
    }

    public function update(Request $request, Shelter $shelter)
    {
        $data = $request->validate($this->rules($shelter));
        DB::transaction(function () use ($shelter, $data) {
            Shelter::whereKey($shelter->id)->lockForUpdate()->firstOrFail()->update($data);
        });

        return back()->with('success', 'Refugio actualizado. Su historial se conserva.');
    }

    public function staff(Request $request, Shelter $shelter)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255', 'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users', 'password' => 'required|string|min:12|confirmed',
            'role' => ['required', Rule::in(['admin'])],
        ]);
        $user = new User(collect($data)->except('role')->all());
        $user->role = $data['role'];
        $user->shelter_id = $shelter->id;
        $user->save();

        return back()->with('success', 'Cuenta del refugio creada.');
    }

    public function profile(Request $request)
    {
        $shelter = $request->user()->shelter;
        if ($request->isMethod('patch')) {
            $shelter->update($request->validate(collect($this->rules($shelter))->except(['slug', 'active'])->all()));

            return back()->with('success', 'Perfil del refugio actualizado.');
        }

        return Inertia::render('Admin/ShelterProfile', ['shelter' => $shelter]);
    }
}
