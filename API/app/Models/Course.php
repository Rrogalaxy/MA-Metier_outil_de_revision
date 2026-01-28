<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $table = 'courses';
    protected $primaryKey = 'course_id';
    public $timestamps = false;

    protected $fillable = [
        'course_name',
        'start_time',
        'end_time',
        'day',
    ];

    protected $rules = [
        'course_name' => 'required',
        'start_time' => 'required',
        'end_time' => 'required',
        'day' => 'required',
    ];

    public function studentClasses(): BelongsToMany
    {
        return $this->belongsToMany(StudentClass::class, 'course_class', 'course_id', 'class_id');
    }
}
