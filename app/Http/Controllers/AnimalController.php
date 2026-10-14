<?php

namespace App\Http\Controllers;

use App\Http\Requests\AnimalRequest;
use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Models\AnimalPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AnimalController extends Controller
{
    public function index(Request $r)
    {
        $f = $r->validate(['q' => 'nullable|string|max:100']);

        return Inertia::render('Admin/Animals', ['animals' => Animal::with('photos')->when($r->filled('q'), fn ($q) => $q->where('name', 'like', '%'.$f['q'].'%'))->latest()->paginate(15)->withQueryString(), 'filters' => $f]);
    }

    public function create()
    {
        Gate::authorize('create', Animal::class);

        return Inertia::render('Admin/AnimalForm');
    }

    public function edit(Animal $animal)
    {
        Gate::authorize('update', $animal);

        return Inertia::render('Admin/AnimalForm', ['animal' => $animal->load('photos')]);
    }

    public function store(AnimalRequest $r)
    {
        Gate::authorize('create', Animal::class);
        $animal = $this->save($r);

        return to_route('admin.animals.edit', $animal)->with('success', 'Animal registrado.');
    }

    public function update(AnimalRequest $r, Animal $animal)
    {
        Gate::authorize('update', $animal);
        $this->save($r, $animal);

        return back()->with('success', 'Datos y fotografías guardados.');
    }

    private function save(AnimalRequest $r, ?Animal $animal = null): Animal
    {
        $paths = [];
        try {
            foreach ($r->file('photos', []) as $file) {
                $paths[] = $file->store('animals', 'public');
            }

            return DB::transaction(function () use ($r, $animal, $paths) {
                $data = $r->safe()->except('photos');
                if ($animal) {
                    $animal = Animal::lockForUpdate()->findOrFail($animal->id);
                    if (in_array($animal->availability_status, ['Adoptado', 'En proceso de adopción'])) {
                        unset($data['availability_status']);
                    } elseif ($data['availability_status'] !== 'Disponible' && $animal->requests()->whereIn('status', AdoptionRequest::ACTIVE)->exists()) {
                        throw ValidationException::withMessages(['availability_status' => 'Primero resolvé las solicitudes activas.']);
                    }
                    $animal->update($data);
                } else {
                    $animal = Animal::create($data);
                }
                foreach ($paths as $path) {
                    $animal->photos()->create(['file_path' => $path, 'is_primary' => ! $animal->photos()->exists()]);
                }

                return $animal;
            }, 3);
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($paths);
            throw $e;
        }
    }

    public function destroy(Animal $animal)
    {
        Gate::authorize('delete', $animal);
        DB::transaction(function () use ($animal) {
            $a = Animal::lockForUpdate()->findOrFail($animal->id);
            if ($a->requests()->whereIn('status', AdoptionRequest::ACTIVE)->exists()) {
                throw ValidationException::withMessages(['animal' => 'Resolvé las solicitudes activas antes de archivar.']);
            }
            $a->delete();
        });

        return back()->with('success', 'Animal archivado; su historial se conserva.');
    }

    public function deletePhoto(Animal $animal, AnimalPhoto $photo)
    {
        Gate::authorize('update', $animal);
        abort_unless($photo->animal_id === $animal->id, 404);
        DB::transaction(function () use ($animal, $photo) {
            Animal::lockForUpdate()->findOrFail($animal->id);
            $photo->delete();
            $first = $animal->photos()->first();
            if ($first) {
                $first->update(['is_primary' => true]);
            }
        });
        Storage::disk('public')->delete($photo->file_path);

        return back()->with('success', 'Fotografía eliminada.');
    }

    public function primaryPhoto(Animal $animal, AnimalPhoto $photo)
    {
        Gate::authorize('update', $animal);
        abort_unless($photo->animal_id === $animal->id, 404);
        DB::transaction(function () use ($animal, $photo) {
            Animal::lockForUpdate()->findOrFail($animal->id);
            $animal->photos()->update(['is_primary' => false]);
            $photo->update(['is_primary' => true]);
        });

        return back()->with('success', 'Imagen principal actualizada.');
    }
}
