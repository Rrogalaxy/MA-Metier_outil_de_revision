<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Activity extends Model
{
    protected $table = 'activities';
    protected $timestamp = false;

    protected $fillable = [
        'activity_name',
        'start_time',
        'end_time',
        'day',
    ];

    protected $rules = [
        'activity_name' => 'required|string',
        'start_time' => 'required|date',
        'end_time' => 'required|date',
        'day' => 'required|string',
    ];

    public function users(): HasOne
    {
        return $this->hasOne(User::class);
    }
}
