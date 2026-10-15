<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnimalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'], 'species' => ['required', Rule::in(['Perro', 'Gato', 'Otro'])],
            'breed' => ['nullable', 'string', 'max:100'], 'sex' => ['required', Rule::in(['Macho', 'Hembra'])],
            'birth_date' => ['nullable', 'date', 'before_or_equal:today'], 'estimated_age' => ['nullable', 'integer', 'min:0', 'max:600'],
            'size' => ['required', Rule::in(['Pequeño', 'Mediano', 'Grande'])], 'color' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:5000'], 'personality' => ['nullable', 'string', 'max:2000'],
            'entry_date' => ['required', 'date', 'before_or_equal:today'],
            'availability_status' => ['required', Rule::in(['Disponible', 'No disponible temporalmente'])],
            'public_health_info' => ['nullable', 'string', 'max:2000'],
            'photos' => ['nullable', 'array', 'max:8'], 'photos.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'dimensions:min_width=1,min_height=1', 'max:4096'],
        ];
    }

    public function messages(): array
    {
        return ['photos.max' => 'Podés cargar hasta 8 fotografías por envío.',
            'photos.*.image' => 'Elegí una imagen válida.', 'photos.*.mimes' => 'Solo se admiten JPEG, PNG y WebP.',
            'photos.*.mimetypes' => 'Solo se admiten JPEG, PNG y WebP.',
            'photos.*.dimensions' => 'No se pudo leer la imagen.', 'photos.*.max' => 'Cada fotografía puede pesar hasta 4 MB.'];
    }
}
