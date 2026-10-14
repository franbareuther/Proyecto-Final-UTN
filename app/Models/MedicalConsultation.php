<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicalConsultation extends Model
{
    protected $fillable = ['consultation_date', 'reason', 'symptoms', 'diagnosis', 'instructions', 'observations', 'veterinarian_id'];

    public function animal()
    {
        return $this->belongsTo(Animal::class)->withTrashed();
    }

    public function veterinarian()
    {
        return $this->belongsTo(User::class, 'veterinarian_id');
    }
}
