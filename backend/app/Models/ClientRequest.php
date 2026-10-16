<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_name',
        'owner_name',
        'username',
        'email',
        'phone',
        'password',
        'status',
        'role',
        'admin_notes',
        'approved_at',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];
}
