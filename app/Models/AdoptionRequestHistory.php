<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdoptionRequestHistory extends Model
{
    protected $table = 'adoption_request_history';

    protected $guarded = ['id'];

    public function actor()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
