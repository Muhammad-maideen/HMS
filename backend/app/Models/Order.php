<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'order_type',
        'table_number',
        'customer_name',
        'customer_phone',
        'subtotal',
        'discount_total',
        'applied_offer_id',
        'applied_offer_code',
        'tax_amount',
        'final_total',
        'payment_method',
        'payment_status',
        'order_status',
        'created_by_role',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'discount_total' => 'float',
        'tax_amount' => 'float',
        'final_total' => 'float',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function appliedOffer()
    {
        return $this->belongsTo(Offer::class, 'applied_offer_id');
    }
}
