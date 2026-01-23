<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentClass extends Model
{
    protected $table = 'classes';

    protected $fillable = ['class_id', 'class_year'];

    public $timestamps = false;

    protected $rules = [
        'class_id' => 'required|unique:classes|string|max:50',
        'class_year' => 'required|integer|min:2010|max:2100',
    ];

    public function users(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
