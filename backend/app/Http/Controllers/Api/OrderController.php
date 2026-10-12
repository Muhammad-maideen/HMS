<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Combo;
use App\Models\Offer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Order::with('items')->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('order_number', 'like', "%{$s}%")
                  ->orWhere('customer_name', 'like', "%{$s}%")
                  ->orWhere('customer_phone', 'like', "%{$s}%");
            });
        }

        if ($request->filled('order_type')) {
            $query->where('order_type', $request->input('order_type'));
        }

        $orders = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'current_page' => $orders->currentPage(),
            'last_page' => $orders->lastPage(),
            'total' => $orders->total(),
        ]);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $order->load(['items', 'appliedOffer']),
        ]);
    }

    /**
     * POS Order Creation & Checkout
     * Never trusts frontend prices; validates items, stock, and applies offers securely.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_type' => 'required|in:dine_in,takeaway,delivery',
            'table_number' => 'nullable|string|max:20',
            'customer_name' => 'nullable|string|max:100',
            'customer_phone' => 'nullable|string|max:30',
            'offer_code' => 'nullable|string|max:30',
            'payment_method' => 'nullable|string|in:cash,card,upi',
            'items' => 'required|array|min:1',
            'items.*.item_type' => 'required|in:product,combo,custom',
            'items.*.product_id' => 'required_if:items.*.item_type,product|nullable|exists:products,id',
            'items.*.combo_id' => 'required_if:items.*.item_type,combo|nullable|exists:combos,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.item_name' => 'required_if:items.*.item_type,custom|nullable|string|max:150',
            'items.*.unit_price' => 'required_if:items.*.item_type,custom|nullable|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.special_notes' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $subtotal = 0.0;
            $orderItemsData = [];

            // 1. Process and price check every line item on backend
            foreach ($validated['items'] as $item) {
                $qty = (int)$item['quantity'];

                if ($item['item_type'] === 'custom') {
                    $unitPrice = (float)($item['unit_price'] ?? 0);
                    $lineTotal = round($unitPrice * $qty, 2);
                    $subtotal += $lineTotal;

                    $orderItemsData[] = [
                        'product_id' => null,
                        'combo_id' => null,
                        'variant_id' => null,
                        'item_type' => 'product',
                        'item_name' => $item['item_name'] ?? 'Custom Item',
                        'variant_name' => 'Custom / Open Item',
                        'unit_price' => $unitPrice,
                        'offer_price' => null,
                        'discount_amount' => 0.0,
                        'quantity' => $qty,
                        'line_total' => $lineTotal,
                        'special_notes' => $item['special_notes'] ?? null,
                    ];
                } elseif ($item['item_type'] === 'product') {
                    $product = Product::lockForUpdate()->find($item['product_id']);

                    if (!$product->is_active) {
                        return response()->json([
                            'success' => false,
                            'message' => "Item '{$product->name}' is currently deactivated.",
                        ], 422);
                    }

                    if (!$product->is_available || $product->stock_quantity < $qty) {
                        return response()->json([
                            'success' => false,
                            'message' => "Item '{$product->name}' is out of stock (Available: {$product->stock_quantity}).",
                        ], 422);
                    }

                    // Decrement stock
                    $product->decrement('stock_quantity', $qty);
                    if ($product->stock_quantity <= 0) {
                        $product->update(['is_available' => false]);
                    }

                    $unitPrice = $product->base_price;
                    $offerPrice = $product->offer_price;
                    $variantName = null;

                    if (!empty($item['variant_id'])) {
                        $variant = ProductVariant::where('product_id', $product->id)->find($item['variant_id']);
                        if ($variant) {
                            $variantName = $variant->variant_name;
                            $unitPrice = $variant->regular_price;
                            $offerPrice = $variant->offer_price;
                        }
                    }

                    // Select price according to order type if defined
                    if ($validated['order_type'] === 'dine_in' && $product->dine_in_price) {
                        // Keep dine in as base
                    }

                    $effectiveLineUnitPrice = ($offerPrice && $offerPrice < $unitPrice) ? $offerPrice : $unitPrice;
                    $itemDiscount = ($offerPrice && $offerPrice < $unitPrice) ? round(($unitPrice - $offerPrice) * $qty, 2) : 0.0;
                    $lineTotal = round($effectiveLineUnitPrice * $qty, 2);
                    $subtotal += $lineTotal;

                    $orderItemsData[] = [
                        'product_id' => $product->id,
                        'combo_id' => null,
                        'variant_id' => $item['variant_id'] ?? null,
                        'item_type' => 'product',
                        'item_name' => $product->name,
                        'variant_name' => $variantName,
                        'unit_price' => $unitPrice,
                        'offer_price' => $offerPrice,
                        'discount_amount' => $itemDiscount,
                        'quantity' => $qty,
                        'line_total' => $lineTotal,
                        'special_notes' => $item['special_notes'] ?? null,
                    ];
                } elseif ($item['item_type'] === 'combo') {
                    $combo = Combo::find($item['combo_id']);

                    if (!$combo->is_active || !$combo->is_available) {
                        return response()->json([
                            'success' => false,
                            'message' => "Combo '{$combo->name}' is currently unavailable.",
                        ], 422);
                    }

                    $lineTotal = round($combo->combo_price * $qty, 2);
                    $itemDiscount = round(($combo->regular_price - $combo->combo_price) * $qty, 2);
                    $subtotal += $lineTotal;

                    $orderItemsData[] = [
                        'product_id' => null,
                        'combo_id' => $combo->id,
                        'variant_id' => null,
                        'item_type' => 'combo',
                        'item_name' => $combo->name,
                        'variant_name' => 'Combo Meal Deal',
                        'unit_price' => $combo->regular_price,
                        'offer_price' => $combo->combo_price,
                        'discount_amount' => $itemDiscount,
                        'quantity' => $qty,
                        'line_total' => $lineTotal,
                        'special_notes' => $item['special_notes'] ?? null,
                    ];
                }
            }

            // 2. Validate and apply bill-level offer if promo code provided
            $appliedOffer = null;
            $offerDiscount = 0.0;
            if (!empty($validated['offer_code'])) {
                $code = strtoupper(trim($validated['offer_code']));
                $offer = Offer::where('code', $code)->first();

                if ($offer && $offer->is_currently_valid && $subtotal >= $offer->min_order_amount) {
                    $offerDiscount = $offer->calculateDiscount($subtotal);
                    $appliedOffer = $offer;
                }
            }

            $discountTotal = $offerDiscount;
            $taxableAmount = max(0.0, $subtotal - $discountTotal);
            // 5% GST for restaurant bills
            $taxAmount = round($taxableAmount * 0.05, 2);
            $finalTotal = round($taxableAmount + $taxAmount, 2);

            // 3. Generate sequential order number
            $orderCount = Order::whereDate('created_at', Carbon::today())->count() + 1;
            $orderNumber = 'ORD-' . Carbon::today()->format('Ymd') . '-' . str_pad($orderCount, 4, '0', STR_PAD_LEFT);

            // 4. Create Order
            $order = Order::create([
                'order_number' => $orderNumber,
                'order_type' => $validated['order_type'],
                'table_number' => $validated['table_number'] ?? null,
                'customer_name' => $validated['customer_name'] ?? 'Walk-in Guest',
                'customer_phone' => $validated['customer_phone'] ?? null,
                'subtotal' => $subtotal,
                'discount_total' => $discountTotal,
                'applied_offer_id' => $appliedOffer ? $appliedOffer->id : null,
                'applied_offer_code' => $appliedOffer ? $appliedOffer->code : null,
                'tax_amount' => $taxAmount,
                'final_total' => $finalTotal,
                'payment_method' => $validated['payment_method'] ?? 'cash',
                'payment_status' => 'paid',
                'order_status' => 'completed',
                'created_by_role' => $request->header('X-User-Role', 'cashier'),
            ]);

            // 5. Create Order Items snapshots
            foreach ($orderItemsData as $oid) {
                $order->items()->create($oid);
            }

            return response()->json([
                'success' => true,
                'message' => 'Order processed and invoice generated successfully',
                'data' => $order->load('items'),
            ], 201);
        });
    }

    /**
     * Cashier End-of-Shift Z-Report Summary
     * Calculates shift sales, tender totals, taxes, discounts, and order range for today.
     */
    public function zReport(Request $request): JsonResponse
    {
        $today = Carbon::today();
        $ordersToday = Order::whereDate('created_at', $today);

        $totalOrders = (clone $ordersToday)->count();
        $totalSales = (float) (clone $ordersToday)->where('payment_status', 'paid')->sum('final_total');
        $cashSales = (float) (clone $ordersToday)->where('payment_status', 'paid')->where('payment_method', 'cash')->sum('final_total');
        $upiSales = (float) (clone $ordersToday)->where('payment_status', 'paid')->where('payment_method', 'upi')->sum('final_total');
        $cardSales = (float) (clone $ordersToday)->where('payment_status', 'paid')->where('payment_method', 'card')->sum('final_total');
        $totalTax = (float) (clone $ordersToday)->where('payment_status', 'paid')->sum('tax_amount');
        $totalDiscounts = (float) (clone $ordersToday)->sum('discount_total');

        $dineInCount = (clone $ordersToday)->where('order_type', 'dine_in')->count();
        $takeawayCount = (clone $ordersToday)->where('order_type', 'takeaway')->count();
        $deliveryCount = (clone $ordersToday)->where('order_type', 'delivery')->count();

        $firstOrder = (clone $ordersToday)->orderBy('created_at', 'asc')->first();
        $lastOrder = (clone $ordersToday)->orderBy('created_at', 'desc')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $today->format('d M Y'),
                'report_timestamp' => Carbon::now()->format('d M Y, h:i:s A'),
                'total_orders' => $totalOrders,
                'total_sales' => round($totalSales, 2),
                'cash_sales' => round($cashSales, 2),
                'upi_sales' => round($upiSales, 2),
                'card_sales' => round($cardSales, 2),
                'total_tax' => round($totalTax, 2),
                'total_discounts' => round($totalDiscounts, 2),
                'dine_in_count' => $dineInCount,
                'takeaway_count' => $takeawayCount,
                'delivery_count' => $deliveryCount,
                'first_order_number' => $firstOrder ? $firstOrder->order_number : 'N/A',
                'last_order_number' => $lastOrder ? $lastOrder->order_number : 'N/A',
                'first_order_time' => $firstOrder ? $firstOrder->created_at->format('h:i A') : 'N/A',
                'last_order_time' => $lastOrder ? $lastOrder->created_at->format('h:i A') : 'N/A',
            ],
        ]);
    }
}
