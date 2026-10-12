<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Combo extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image_url',
        'regular_price',
        'combo_price',
        'customer_savings',
        'badge_text',
        'is_active',
        'is_available',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'regular_price' => 'float',
        'combo_price' => 'float',
        'customer_savings' => 'float',
        'is_active' => 'boolean',
        'is_available' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    protected $appends = [
        'is_currently_valid',
        'calculated_savings',
    ];

    public function items()
    {
        return $this->hasMany(ComboItem::class);
    }

    public function getIsCurrentlyValidAttribute(): bool
    {
        if (!$this->is_active || !$this->is_available) {
            return false;
        }

        $now = Carbon::now();
        if ($this->start_date && $now->lt($this->start_date)) {
            return false;
        }
        if ($this->end_date && $now->gt($this->end_date)) {
            return false;
        }

        return true;
    }

    public function getCalculatedSavingsAttribute(): float
    {
        return max(0.0, round($this->regular_price - $this->combo_price, 2));
    }
}
