<?php

namespace App\Models;

use App\Models\Concerns\ScopedToStaffShelter;
use Illuminate\Database\Eloquent\Model;

class Vaccination extends Model
{
    use ScopedToStaffShelter;

    protected $fillable = ['vaccine_name', 'application_date', 'dose', 'next_dose_date', 'observations', 'recorded_by', 'updated_by', 'practitioner_name'];

    public function animal()
    {
        return $this->belongsTo(Animal::class)->withTrashed();
    }

    public function nextDose()
    {
        return $this->hasOne(VaccinationDose::class, 'source_vaccination_id');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
