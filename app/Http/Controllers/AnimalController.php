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
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AnimalController extends Controller
{
    public function index(Request $r)
    {
        $f = $r->validate(['q' => 'nullable|string|max:100', 'species' => ['nullable', Rule::in(['Perro', 'Gato', 'Otro'])],
            'status' => ['nullable', Rule::in(['Disponible', 'No disponible temporalmente', 'En proceso de adopción', 'Adoptado'])], 'archive' => 'nullable|in:active,archived,all']);
        $animals = Animal::with('photos');
        if (($f['archive'] ?? 'active') === 'archived') {
            $animals->onlyTrashed();
        } elseif (($f['archive'] ?? 'active') === 'all') {
            $animals->withTrashed();
        }
        $animals->when($f['q'] ?? null, fn ($q, $term) => $q->where('name', 'like', '%'.$term.'%'))
            ->when($f['species'] ?? null, fn ($q, $species) => $q->where('species', $species))
            ->when($f['status'] ?? null, fn ($q, $status) => $q->where('availability_status', $status));

        return Inertia::render('Admin/Animals', ['animals' => $animals->latest()->orderByDesc('id')->paginate(15)->withQueryString(), 'filters' => $f]);
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
                $path = 'animals/'.$file->hashName();
                $paths[] = $path;
                if (! Storage::disk('public')->putFileAs('animals', $file, $file->hashName())) {
                    throw ValidationException::withMessages(['photos' => 'No se pudieron guardar las fotografías. Intentá nuevamente.']);
                }
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
                    if (! $animal->fill($data)->save()) {
                        throw ValidationException::withMessages(['animal' => 'No se pudieron guardar los cambios.']);
                    }
                } else {
                    $animal = new Animal($data + ['shelter_id' => $r->user()->shelter_id]);
                    if (! $animal->save()) {
                        throw ValidationException::withMessages(['animal' => 'No se pudo registrar el animal.']);
                    }
                }
                foreach ($paths as $path) {
                    $photo = $animal->photos()->make(['file_path' => $path, 'is_primary' => ! $animal->photos()->exists()]);
                    if (! $photo->save()) {
                        throw ValidationException::withMessages(['photos' => 'No se pudieron guardar las fotografías.']);
                    }
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
        $path = DB::transaction(function () use ($animal, $photo) {
            $lockedAnimal = Animal::lockForUpdate()->findOrFail($animal->id);
            $lockedPhoto = $lockedAnimal->photos()->whereKey($photo->id)->lockForUpdate()->firstOrFail();
            $path = $lockedPhoto->file_path;
            $lockedPhoto->delete();
            $first = $lockedAnimal->photos()->first();
            if ($first) {
                $first->update(['is_primary' => true]);
            }

            return $path;
        });
        Storage::disk('public')->delete($path);

        return back()->with('success', 'Fotografía eliminada.');
    }

    public function primaryPhoto(Animal $animal, AnimalPhoto $photo)
    {
        Gate::authorize('update', $animal);
        abort_unless($photo->animal_id === $animal->id, 404);
        DB::transaction(function () use ($animal, $photo) {
            $lockedAnimal = Animal::lockForUpdate()->findOrFail($animal->id);
            $lockedPhoto = $lockedAnimal->photos()->whereKey($photo->id)->lockForUpdate()->firstOrFail();
            $lockedAnimal->photos()->update(['is_primary' => false]);
            $lockedPhoto->update(['is_primary' => true]);
        });

        return back()->with('success', 'Imagen principal actualizada.');
    }
}
