<?php

namespace App\Models;

use App\Models\Concerns\ScopedToStaffShelter;
use Illuminate\Database\Eloquent\Model;

class Vaccination extends Model
{
    use ScopedToStaffShelter;

    protected $fillable = ['vaccine_name', 'application_date', 'dose', 'next_dose_date', 'observations', 'veterinarian_id'];

    public function animal()
    {
        return $this->belongsTo(Animal::class)->withTrashed();
    }

    public function veterinarian()
    {
        return $this->belongsTo(User::class, 'veterinarian_id');
    }
}
