<?php

namespace App\Models;

use App\Models\Concerns\ScopedToStaffShelter;
use Illuminate\Database\Eloquent\Model;

class AdoptionRequest extends Model
{
    use ScopedToStaffShelter;

    public const ACTIVE = ['Nueva', 'En revisión', 'Aprobada'];

    protected $fillable = ['phone', 'address', 'housing_type', 'has_other_pets', 'previous_experience', 'motivation', 'additional_information'];

    protected function casts(): array
    {
        return ['has_other_pets' => 'boolean', 'reviewed_at' => 'datetime'];
    }

    public function animal()
    {
        return $this->belongsTo(Animal::class)->withTrashed();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function history()
    {
        return $this->hasMany(AdoptionRequestHistory::class)->with('actor:id,name,last_name')->orderBy('id');
    }

    public function adoption()
    {
        return $this->hasOne(Adoption::class);
    }
}
