<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'combo_id',
        'variant_id',
        'item_type',
        'item_name',
        'variant_name',
        'unit_price',
        'offer_price',
        'discount_amount',
        'quantity',
        'line_total',
        'special_notes',
    ];

    protected $casts = [
        'unit_price' => 'float',
        'offer_price' => 'float',
        'discount_amount' => 'float',
        'quantity' => 'integer',
        'line_total' => 'float',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
