<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Combo;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardStatsController extends Controller
{
    public function index(): JsonResponse
    {
        $now = Carbon::now();

        $totalProducts = Product::count();
        $activeProducts = Product::where('is_active', true)->count();
        $outOfStockCount = Product::where('is_available', false)->orWhere('stock_quantity', '<=', 0)->count();
        $totalCategories = Category::where('is_active', true)->count();

        $activeOffers = Offer::where('is_active', true)
            ->where('start_time', '<=', $now)
            ->where('end_time', '>=', $now)
            ->count();

        $activeCombos = Combo::where('is_active', true)->where('is_available', true)->count();

        $totalRevenue = (float) Order::where('payment_status', 'paid')->sum('final_total');
        $todayOrders = Order::whereDate('created_at', Carbon::today())->count();
        $todayRevenue = (float) Order::whereDate('created_at', Carbon::today())->where('payment_status', 'paid')->sum('final_total');

        $outOfStockProducts = Product::with('category')
            ->where(function ($q) {
                $q->where('is_available', false)
                  ->orWhere('stock_quantity', '<=', 0);
            })
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'out_of_stock_count' => $outOfStockCount,
                'total_categories' => $totalCategories,
                'active_offers' => $activeOffers,
                'active_combos' => $activeCombos,
                'total_revenue' => round($totalRevenue, 2),
                'today_orders' => $todayOrders,
                'today_revenue' => round($todayRevenue, 2),
                'out_of_stock_products' => $outOfStockProducts,
            ],
        ]);
    }
}
