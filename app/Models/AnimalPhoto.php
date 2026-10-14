<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnimalPhoto extends Model
{
    protected $fillable = ['file_path', 'is_primary'];

    protected function casts(): array
    {
        return ['is_primary' => 'boolean'];
    }

    public function animal()
    {
        return $this->belongsTo(Animal::class);
    }
}
