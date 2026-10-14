<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MedicalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'veterinario';
    }

    public function rules(): array
    {
        $rules = match ($this->route('type')) {
            'consultations' => ['consultation_date' => ['required', 'date', 'before_or_equal:today'], 'reason' => ['required', 'string', 'max:255'], 'symptoms' => ['nullable', 'string', 'max:5000'], 'diagnosis' => ['required', 'string', 'max:5000'], 'instructions' => ['nullable', 'string', 'max:5000']],
            'vaccinations' => ['vaccine_name' => ['required', 'string', 'max:255'], 'application_date' => ['required', 'date', 'before_or_equal:today'], 'dose' => ['nullable', 'string', 'max:255'], 'next_dose_date' => ['nullable', 'date', 'after_or_equal:application_date']],
            'treatments' => ['description' => ['required', 'string', 'max:5000'], 'start_date' => ['required', 'date'], 'estimated_end_date' => ['nullable', 'date', 'after_or_equal:start_date'], 'status' => ['required', Rule::in(['Activo', 'Finalizado', 'Suspendido'])]],
            'controls' => ['control_type' => ['required', 'string', 'max:255'], 'scheduled_date' => ['required', 'date'], 'status' => ['required', Rule::in(['Pendiente', 'Realizado', 'Cancelado'])]],
            default => abort(404),
        };

        return $rules + ['observations' => ['nullable', 'string', 'max:5000']];
    }
}
