<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'sku',
        'description',
        'base_price',
        'offer_price',
        'dine_in_price',
        'takeaway_price',
        'delivery_price',
        'is_featured',
        'is_bestseller',
        'is_new_arrival',
        'is_todays_special',
        'is_active',
        'is_available',
        'stock_quantity',
        'image_url',
    ];

    protected $casts = [
        'base_price' => 'float',
        'offer_price' => 'float',
        'dine_in_price' => 'float',
        'takeaway_price' => 'float',
        'delivery_price' => 'float',
        'is_featured' => 'boolean',
        'is_bestseller' => 'boolean',
        'is_new_arrival' => 'boolean',
        'is_todays_special' => 'boolean',
        'is_active' => 'boolean',
        'is_available' => 'boolean',
        'stock_quantity' => 'integer',
    ];

    protected $appends = [
        'discount_amount',
        'discount_percentage',
        'final_price',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function getDiscountAmountAttribute(): float
    {
        if ($this->offer_price && $this->offer_price < $this->base_price) {
            return round($this->base_price - $this->offer_price, 2);
        }
        return 0.00;
    }

    public function getDiscountPercentageAttribute(): int
    {
        if ($this->offer_price && $this->offer_price < $this->base_price && $this->base_price > 0) {
            return (int) round((($this->base_price - $this->offer_price) / $this->base_price) * 100);
        }
        return 0;
    }

    public function getFinalPriceAttribute(): float
    {
        return ($this->offer_price && $this->offer_price < $this->base_price)
            ? (float) $this->offer_price
            : (float) $this->base_price;
    }
}
