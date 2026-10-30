<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VaccinationCertificate extends Model
{
    protected $fillable = ['vaccine_name', 'application_date', 'file_path', 'notes'];

    protected $hidden = ['file_path'];

    protected function casts(): array
    {
        return ['application_date' => 'date:Y-m-d', 'reviewed_at' => 'datetime'];
    }

    public function adoption()
    {
        return $this->belongsTo(Adoption::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
