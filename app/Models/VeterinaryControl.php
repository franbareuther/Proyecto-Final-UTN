<?php

namespace App\Models;

use App\Models\Concerns\ScopedToStaffShelter;
use Illuminate\Database\Eloquent\Model;

class VeterinaryControl extends Model
{
    use ScopedToStaffShelter;

    protected $fillable = ['control_type', 'scheduled_date', 'status', 'observations', 'recorded_by', 'updated_by', 'practitioner_name'];

    public function animal()
    {
        return $this->belongsTo(Animal::class)->withTrashed();
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
