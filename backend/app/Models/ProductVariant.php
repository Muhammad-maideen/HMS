<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'variant_name',
        'sku',
        'regular_price',
        'offer_price',
        'dine_in_price',
        'takeaway_price',
        'delivery_price',
        'is_available',
    ];

    protected $casts = [
        'regular_price' => 'float',
        'offer_price' => 'float',
        'dine_in_price' => 'float',
        'takeaway_price' => 'float',
        'delivery_price' => 'float',
        'is_available' => 'boolean',
    ];

    protected $appends = [
        'discount_amount',
        'discount_percentage',
        'final_price',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function getDiscountAmountAttribute(): float
    {
        if ($this->offer_price && $this->offer_price < $this->regular_price) {
            return round($this->regular_price - $this->offer_price, 2);
        }
        return 0.00;
    }

    public function getDiscountPercentageAttribute(): int
    {
        if ($this->offer_price && $this->offer_price < $this->regular_price && $this->regular_price > 0) {
            return (int) round((($this->regular_price - $this->offer_price) / $this->regular_price) * 100);
        }
        return 0;
    }

    public function getFinalPriceAttribute(): float
    {
        return ($this->offer_price && $this->offer_price < $this->regular_price)
            ? (float) $this->offer_price
            : (float) $this->regular_price;
    }
}
