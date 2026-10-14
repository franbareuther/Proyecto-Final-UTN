<?php

namespace App\Models;

use App\Models\Concerns\ScopedToStaffShelter;
use Illuminate\Database\Eloquent\Model;

class Adoption extends Model
{
    use ScopedToStaffShelter;

    protected $guarded = ['id'];

    public function animal()
    {
        return $this->belongsTo(Animal::class)->withTrashed();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function request()
    {
        return $this->belongsTo(AdoptionRequest::class, 'adoption_request_id');
    }
}
