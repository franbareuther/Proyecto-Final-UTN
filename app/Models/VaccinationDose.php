<?php

namespace App\Models;

use App\Models\Concerns\ScopedToStaffShelter;
use Illuminate\Database\Eloquent\Model;

class VaccinationDose extends Model
{
    use ScopedToStaffShelter;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['scheduled_date' => 'date:Y-m-d', 'resolved_at' => 'datetime', 'legacy_unverified' => 'boolean'];
    }

    public function animal()
    {
        return $this->belongsTo(Animal::class)->withTrashed();
    }

    public function source()
    {
        return $this->belongsTo(Vaccination::class, 'source_vaccination_id');
    }

    public function application()
    {
        return $this->belongsTo(Vaccination::class, 'application_vaccination_id');
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
