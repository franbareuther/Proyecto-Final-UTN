<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VeterinaryControl extends Model
{
    protected $fillable = ['control_type', 'scheduled_date', 'status', 'observations', 'veterinarian_id'];

    public function animal()
    {
        return $this->belongsTo(Animal::class)->withTrashed();
    }

    public function veterinarian()
    {
        return $this->belongsTo(User::class, 'veterinarian_id');
    }
}
