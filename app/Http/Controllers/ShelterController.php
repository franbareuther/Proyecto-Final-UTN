<?php

namespace App\Http\Controllers;

use App\Models\Shelter;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
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
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'dimensions:min_width=1,min_height=1', 'max:5120', 'prohibited_if:remove_image,1,true'],
            'image_type' => ['sometimes', 'required', Rule::in(['photo', 'logo'])],
            'remove_image' => 'sometimes|boolean',
            'image_path' => 'prohibited', 'image_url' => 'prohibited',
        ];
    }

    private function imageMessages(): array
    {
        return [
            'image.image' => 'Elegí una imagen JPEG, PNG o WebP válida.',
            'image.mimes' => 'Solo se admiten imágenes JPEG, PNG y WebP; no SVG.',
            'image.mimetypes' => 'Solo se admiten imágenes JPEG, PNG y WebP; no SVG.',
            'image.max' => 'La imagen no puede superar los 5 MB.',
            'image.dimensions' => 'No se pudo leer la imagen. Elegí un archivo JPEG, PNG o WebP válido.',
            'image.uploaded' => 'No se pudo recibir la imagen. Verificá su tamaño e intentá nuevamente.',
            'image.prohibited_if' => 'Elegí reemplazar o quitar la imagen, no ambas acciones a la vez.',
            'image_type.in' => 'Elegí Fotografía o Logo.',
        ];
    }

    private function saveShelter(Request $request, array $data, ?Shelter $shelter = null): void
    {
        $newPath = null;
        $oldPath = null;
        unset($data['image'], $data['remove_image']);
        try {
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $newPath = 'shelters/'.$file->hashName();
                if (! Storage::disk('public')->putFileAs('shelters', $file, $file->hashName())) {
                    throw ValidationException::withMessages(['image' => 'No se pudo guardar la imagen. Intentá nuevamente.']);
                }
            }
            DB::transaction(function () use ($request, $data, $shelter, $newPath, &$oldPath) {
                $record = $shelter ? Shelter::whereKey($shelter->id)->lockForUpdate()->firstOrFail() : new Shelter;
                $record->fill($data);
                if ($newPath || $request->boolean('remove_image')) {
                    $oldPath = $record->image_path;
                    $record->image_path = $newPath ?: null;
                }
                if (! $record->save()) {
                    throw ValidationException::withMessages(['image' => 'No se pudieron guardar los cambios. La imagen anterior se conserva.']);
                }
            });
        } catch (\Throwable $error) {
            if ($newPath) {
                Storage::disk('public')->delete($newPath);
            }
            throw $error;
        }
        // Only remove server-generated shelter files after the database commit.
        if ($oldPath && preg_match('~^shelters/[a-zA-Z0-9]+\.(?:jpe?g|png|webp)$~', $oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }
    }

    public function store(Request $request)
    {
        abort_unless($request->user()?->role === 'superadmin', 403);
        $this->saveShelter($request, $request->validate($this->rules(), $this->imageMessages()));

        return back()->with('success', 'Refugio creado. Ahora podés asignar su administrador.');
    }

    public function update(Request $request, Shelter $shelter)
    {
        abort_unless($request->user()?->role === 'superadmin', 403);
        $this->saveShelter($request, $request->validate($this->rules($shelter), $this->imageMessages()), $shelter);

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
        abort_unless($request->user()?->role === 'admin' && $request->user()->shelter?->active, 403);
        $shelter = $request->user()->shelter;
        if ($request->isMethod('patch')) {
            $data = $request->validate(collect($this->rules($shelter))->except(['slug', 'active'])->all(), $this->imageMessages());
            $this->saveShelter($request, $data, $shelter);

            return back()->with('success', 'Perfil del refugio actualizado.');
        }

        return Inertia::render('Admin/ShelterProfile', ['shelter' => $shelter]);
    }
}
