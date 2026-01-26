<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentClass extends Model
{
    protected $table = 'classes';

    protected $fillable = ['class_name', 'class_year'];

    public $timestamps = false;

    protected $rules = [
        'class_name' => 'required|string|max:50',
        'class_year' => 'required|integer|min:2010|max:2100',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'class_id');
    }
}
