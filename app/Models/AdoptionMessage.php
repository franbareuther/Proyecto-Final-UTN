<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdoptionMessage extends Model
{
    public const TYPES = ['message', 'warning', 'system'];

    protected $fillable = ['body', 'type'];

    public function request()
    {
        return $this->belongsTo(AdoptionRequest::class, 'adoption_request_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
