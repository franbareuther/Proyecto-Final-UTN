<?php

namespace App\Models;

use App\Models\Concerns\ScopedToStaffShelter;
use Illuminate\Database\Eloquent\Model;

class HealthAudit extends Model
{
    use ScopedToStaffShelter;

    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['before_values' => 'array', 'after_values' => 'array'];
    }

    public function animal()
    {
        return $this->belongsTo(Animal::class)->withTrashed();
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
