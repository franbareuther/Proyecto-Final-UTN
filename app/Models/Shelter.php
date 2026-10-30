<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Shelter extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'city', 'address', 'email', 'phone', 'website', 'instagram', 'facebook', 'active', 'image_type'];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? Storage::disk('public')->url($this->image_path) : null;
    }

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
