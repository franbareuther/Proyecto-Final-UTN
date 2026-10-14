<?php

namespace App\Models;

use App\Models\Concerns\ScopedToStaffShelter;
use Illuminate\Database\Eloquent\Model;

class Treatment extends Model
{
    use ScopedToStaffShelter;

    protected $fillable = ['description', 'start_date', 'estimated_end_date', 'status', 'observations', 'veterinarian_id'];

    public function animal()
    {
        return $this->belongsTo(Animal::class)->withTrashed();
    }

    public function veterinarian()
    {
        return $this->belongsTo(User::class, 'veterinarian_id');
    }
}
