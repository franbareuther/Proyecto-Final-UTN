<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MedicalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        $rules = match ($this->route('type')) {
            'consultations' => ['consultation_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'], 'reason' => ['required', 'string', 'max:255'], 'symptoms' => ['nullable', 'string', 'max:5000'], 'diagnosis' => ['required', 'string', 'max:5000'], 'instructions' => ['nullable', 'string', 'max:5000']],
            'vaccinations' => $this->vaccinationRules(),
            'treatments' => ['treatment_type' => ['sometimes', 'required', Rule::in(['Tratamiento', 'Desparasitación', 'Medicación'])], 'description' => ['required', 'string', 'max:5000'], 'medication' => ['nullable', 'string', 'max:255'], 'start_date' => ['required', 'date_format:Y-m-d'], 'estimated_end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'], 'status' => ['required', Rule::in(['Activo', 'Finalizado', 'Suspendido'])]],
            'controls' => ['control_type' => ['required', 'string', 'max:255'], 'scheduled_date' => ['required', 'date_format:Y-m-d'], 'status' => ['required', Rule::in(['Pendiente', 'Realizado', 'Cancelado'])]],
            default => abort(404),
        };

        return $rules + ['practitioner_name' => ['nullable', 'string', 'max:255'], 'observations' => ['nullable', 'string', 'max:5000']];
    }

    public function vaccinationRules(): array
    {
        return ['vaccine_name' => ['required', 'string', 'max:255'], 'application_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'], 'dose' => ['nullable', 'string', 'max:255'], 'next_dose_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:application_date']];
    }

    public function messages(): array
    {
        return ['required' => 'Completá este campo.', 'date' => 'Ingresá una fecha válida.', 'date_format' => 'Ingresá una fecha válida (año-mes-día).',
            'before_or_equal' => 'La fecha no puede ser futura.', 'after_or_equal' => 'La fecha final debe ser igual o posterior a la inicial.',
            'max' => 'El texto supera el máximo permitido (:max caracteres).', 'string' => 'Ingresá texto válido.', 'in' => 'Elegí uno de los estados disponibles.'];
    }
}
