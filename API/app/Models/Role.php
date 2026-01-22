<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $fillable = ['role_name'];

    protected $rules = ['role_name' => 'required|unique:roles|string|max:100'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
