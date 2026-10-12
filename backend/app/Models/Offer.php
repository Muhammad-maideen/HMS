<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'code',
        'description',
        'discount_type',
        'discount_value',
        'min_order_amount',
        'max_discount_amount',
        'start_time',
        'end_time',
        'badge_text',
        'target_type',
        'target_ids',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'float',
        'min_order_amount' => 'float',
        'max_discount_amount' => 'float',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'target_ids' => 'array',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'is_currently_valid',
        'status_label',
    ];

    public function getIsCurrentlyValidAttribute(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = Carbon::now();
        if ($this->start_time && $now->lt($this->start_time)) {
            return false;
        }
        if ($this->end_time && $now->gt($this->end_time)) {
            return false;
        }

        return true;
    }

    public function getStatusLabelAttribute(): string
    {
        if (!$this->is_active) {
            return 'Inactive';
        }

        $now = Carbon::now();
        if ($this->start_time && $now->lt($this->start_time)) {
            return 'Scheduled';
        }
        if ($this->end_time && $now->gt($this->end_time)) {
            return 'Expired';
        }

        return 'Active';
    }

    /**
     * Compute discount amount given a subtotal
     */
    public function calculateDiscount(float $subtotal): float
    {
        if (!$this->is_currently_valid) {
            return 0.00;
        }

        if ($subtotal < $this->min_order_amount) {
            return 0.00;
        }

        $discount = 0.00;
        if ($this->discount_type === 'percentage') {
            $discount = ($subtotal * $this->discount_value) / 100.0;
            if ($this->max_discount_amount && $discount > $this->max_discount_amount) {
                $discount = $this->max_discount_amount;
            }
        } elseif ($this->discount_type === 'fixed') {
            $discount = min($this->discount_value, $subtotal);
        }

        return round($discount, 2);
    }
}
