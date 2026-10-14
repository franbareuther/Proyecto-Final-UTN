<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class AnimalFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->firstName(), 'species' => 'Perro', 'breed' => 'Mestizo', 'sex' => 'Hembra',
            'estimated_age' => 24, 'size' => 'Mediano', 'color' => 'Marrón', 'description' => 'Animal de prueba sociable y tranquilo.',
            'personality' => 'Sociable', 'entry_date' => today(), 'availability_status' => 'Disponible',
            'public_health_info' => 'Consultar al refugio para conocer sus cuidados.',
        ];
    }
}
