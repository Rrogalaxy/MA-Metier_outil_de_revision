<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'string';
    protected $with = ['studentClass', 'activities'];

    protected $fillable = [
        'email',
        'last_name',
        'first_name',
        'role_name',
        'class_id',
        'class_name',
        'class_year',
        'entry_year',
        'password',
        'remember_token',
    ];

    protected $rules = [
        'email' => 'required|string|email|max:60|unique:users',
        'last_name' => 'required|string',
        'first_name' => 'required|string',
        'role_name' => 'required|exists:roles|role_name',
        'class_id' => 'integer',
        'entry_year' => 'integer',
    ];

    public $timestamps = true;

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            //'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role(): HasOne
    {
        return $this->hasOne(Role::class);
    }

    public function studentClass(): BelongsTo
    {
        return $this->belongsTo(StudentClass::class, 'class_id', 'class_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }
}
