<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FollowUpCheckin extends Model
{
    protected $fillable = ['sequence', 'due_date'];

    protected function casts(): array
    {
        return ['due_date' => 'date:Y-m-d', 'submitted_at' => 'datetime', 'reviewed_at' => 'datetime'];
    }

    public function adoption()
    {
        return $this->belongsTo(Adoption::class);
    }

    public function photos()
    {
        return $this->hasMany(FollowUpPhoto::class)->orderBy('id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
