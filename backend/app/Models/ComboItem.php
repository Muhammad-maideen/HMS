<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComboItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'combo_id',
        'product_id',
        'variant_id',
        'quantity',
        'is_optional',
        'substitution_notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'is_optional' => 'boolean',
    ];

    public function combo()
    {
        return $this->belongsTo(Combo::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function getEffectiveUnitPriceAttribute(): float
    {
        if ($this->variant) {
            return $this->variant->final_price;
        }
        if ($this->product) {
            return $this->product->final_price;
        }
        return 0.00;
    }
}
