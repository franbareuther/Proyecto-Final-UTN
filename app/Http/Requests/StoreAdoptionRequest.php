<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdoptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'adoptante';
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'max:40'], 'address' => ['required', 'string', 'max:255'],
            'housing_type' => ['required', Rule::in(['Casa', 'Departamento', 'Otro'])], 'has_other_pets' => ['required', 'boolean'],
            'previous_experience' => ['required', 'string', 'max:3000'], 'motivation' => ['required', 'string', 'min:20', 'max:3000'],
            'additional_information' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
