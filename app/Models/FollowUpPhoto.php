<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FollowUpPhoto extends Model
{
    protected $fillable = ['category', 'file_path'];

    // La ruta interna del archivo privado no se envía al navegador.
    protected $hidden = ['file_path'];

    public function checkin()
    {
        return $this->belongsTo(FollowUpCheckin::class, 'follow_up_checkin_id');
    }
}
