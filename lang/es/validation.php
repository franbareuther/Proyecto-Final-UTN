<?php

return [
    'required' => 'Completá :attribute.', 'string' => ':attribute debe ser un texto.',
    'email' => 'Ingresá un correo electrónico válido.', 'lowercase' => 'Ingresá :attribute en minúsculas.',
    'unique' => 'Ya existe una cuenta con ese :attribute.', 'confirmed' => 'La confirmación de :attribute no coincide.',
    'current_password' => 'La contraseña actual no es correcta.', 'in' => 'Elegí una opción válida para :attribute.',
    'boolean' => 'Elegí una opción válida para :attribute.',
    'min' => ['string' => ':attribute debe tener al menos :min caracteres.'],
    'max' => ['string' => ':attribute no puede superar los :max caracteres.'],
    'attributes' => ['name' => 'nombre', 'last_name' => 'apellido', 'email' => 'correo electrónico',
        'password' => 'contraseña', 'password_confirmation' => 'confirmación de contraseña',
        'current_password' => 'contraseña actual', 'token' => 'enlace de recuperación',
        'phone' => 'teléfono', 'address' => 'domicilio', 'housing_type' => 'tipo de vivienda',
        'previous_experience' => 'experiencia con animales', 'motivation' => 'motivación',
        'additional_information' => 'información adicional', 'observations' => 'motivo visible',
        'internal_notes' => 'nota interna', 'status' => 'estado'],
];
