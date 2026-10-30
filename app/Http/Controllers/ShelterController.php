<?php

namespace App\Http\Controllers;

use App\Models\Shelter;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
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
            'website' => 'nullable|url:http,https|max:255', 'instagram' => 'nullable|url:http,https|max:255', 'facebook' => 'nullable|url:http,https|max:255',
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
            'website.url' => 'Ingresá la dirección completa del sitio, por ejemplo https://mirefugio.org.',
            'instagram.url' => 'Ingresá el enlace completo de Instagram, por ejemplo https://instagram.com/mirefugio.',
            'facebook.url' => 'Ingresá el enlace completo de Facebook, por ejemplo https://facebook.com/mirefugio.',
        ];
    }

    /** @param  (callable(Shelter): void)|null  $after  Runs inside the same transaction, so a failure also discards the new image. */
    private function saveShelter(Request $request, array $data, ?Shelter $shelter = null, ?callable $after = null): Shelter
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
            $record = DB::transaction(function () use ($request, $data, $shelter, $newPath, &$oldPath, $after) {
                $record = $shelter ? Shelter::whereKey($shelter->id)->lockForUpdate()->firstOrFail() : new Shelter;
                $record->fill($data);
                if ($newPath || $request->boolean('remove_image')) {
                    $oldPath = $record->image_path;
                    $record->image_path = $newPath ?: null;
                }
                if (! $record->save()) {
                    throw ValidationException::withMessages(['image' => 'No se pudieron guardar los cambios. La imagen anterior se conserva.']);
                }
                if ($after) {
                    $after($record);
                }

                return $record;
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

        return $record;
    }

    private function uniqueSlug(string $name): string
    {
        $base = trim(Str::limit(Str::slug($name), 90, ''), '-') ?: 'refugio';
        $slug = $base;
        for ($i = 2; Shelter::where('slug', $slug)->exists(); $i++) {
            $slug = $base.'-'.$i;
        }

        return $slug;
    }

    public function registerForm()
    {
        return Inertia::render('Auth/RegisterShelter');
    }

    public function register(Request $request)
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => Str::lower(trim($request->input('email')))]);
        }
        $shared = collect($this->rules())->only(['address', 'image', 'image_type', 'website', 'instagram', 'facebook'])->all();
        $data = $request->validate($shared + [
            'shelter_name' => 'required|string|max:100',
            'name' => 'required|string|max:255', 'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::defaults()],
            'phone' => 'required|string|max:50', 'city' => 'required|string|max:100',
            'description' => 'required|string|min:20|max:5000',
        ], $this->imageMessages() + [
            'shelter_name.required' => 'Ingresá el nombre del refugio.',
            'name.required' => 'Ingresá el nombre de la persona responsable.',
            'last_name.required' => 'Ingresá el apellido de la persona responsable.',
            'email.required' => 'Ingresá un correo electrónico.',
            'email.email' => 'Ingresá un correo electrónico válido.',
            'email.unique' => 'Ya existe una cuenta con ese correo. Ingresá con tu contraseña o usá otro correo.',
            'password.required' => 'Ingresá una contraseña.',
            'password.min' => 'La contraseña debe tener al menos :min caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'phone.required' => 'Ingresá un teléfono de contacto.',
            'city.required' => 'Ingresá la localidad del refugio.',
            'description.required' => 'Contanos brevemente sobre el refugio.',
            'description.min' => 'La descripción debe tener al menos :min caracteres.',
        ]);
        $user = null;
        $this->saveShelter($request, [
            'name' => $data['shelter_name'], 'slug' => $this->uniqueSlug($data['shelter_name']),
            'description' => $data['description'], 'city' => $data['city'], 'address' => $data['address'] ?? null,
            'email' => $data['email'], 'phone' => $data['phone'], 'active' => true,
            'website' => $data['website'] ?? null, 'instagram' => $data['instagram'] ?? null, 'facebook' => $data['facebook'] ?? null,
            'image_type' => $data['image_type'] ?? 'photo',
        ], after: function (Shelter $shelter) use ($data, &$user) {
            // El rol y el refugio nunca se toman del formulario.
            $user = new User(['name' => $data['name'], 'last_name' => $data['last_name'], 'email' => $data['email'], 'password' => $data['password']]);
            $user->role = 'admin';
            $user->shelter_id = $shelter->id;
            $user->save();
        });

        event(new Registered($user));
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('admin.dashboard')->with('success', '¡Tu refugio ya forma parte de Huellita! Completá su perfil y empezá a cargar a tus animales.');
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
