<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shelter extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'city', 'address', 'email', 'phone', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function animals()
    {
        return $this->hasMany(Animal::class);
    }

    public function staff()
    {
        return $this->hasMany(User::class);
    }
}
