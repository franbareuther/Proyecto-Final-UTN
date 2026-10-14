<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Animal extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'species', 'breed', 'sex', 'birth_date', 'estimated_age', 'size', 'color', 'description', 'personality', 'entry_date', 'availability_status', 'public_health_info'];

    protected $appends = ['photo_url'];

    protected function casts(): array
    {
        return ['birth_date' => 'date:Y-m-d', 'entry_date' => 'date:Y-m-d'];
    }

    public function photos()
    {
        return $this->hasMany(AnimalPhoto::class)->orderByDesc('is_primary')->orderBy('id');
    }

    public function requests()
    {
        return $this->hasMany(AdoptionRequest::class);
    }

    public function adoption()
    {
        return $this->hasOne(Adoption::class);
    }

    public function consultations()
    {
        return $this->hasMany(MedicalConsultation::class);
    }

    public function vaccinations()
    {
        return $this->hasMany(Vaccination::class);
    }

    public function treatments()
    {
        return $this->hasMany(Treatment::class);
    }

    public function controls()
    {
        return $this->hasMany(VeterinaryControl::class);
    }

    public function getPhotoUrlAttribute(): string
    {
        $photo = $this->photos->first();

        return $photo ? Storage::disk('public')->url($photo->file_path) : '/images/animal-placeholder.svg';
    }
}
