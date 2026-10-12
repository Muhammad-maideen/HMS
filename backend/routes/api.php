<?php

use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ComboController;
use App\Http\Controllers\Api\DashboardStatsController;
use App\Http\Controllers\Api\DiningTableController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductImageController;
use App\Http\Middleware\CheckRestaurantRole;
use Illuminate\Support\Facades\Route;

Route::middleware([CheckRestaurantRole::class])->group(function () {

    // Dashboard Analytics
    Route::get('/dashboard/stats', [DashboardStatsController::class, 'index']);

    // Categories
    Route::apiResource('categories', CategoryController::class);

    // Products
    Route::apiResource('products', ProductController::class);
    Route::patch('/products/{product}/toggle-status', [ProductController::class, 'toggleStatus']);
    Route::patch('/products/{product}/toggle-availability', [ProductController::class, 'toggleAvailability']);
    Route::post('/products/bulk-availability', [ProductController::class, 'bulkAvailability']);

    // Product Images
    Route::get('/products/{product}/images', [ProductImageController::class, 'index']);
    Route::post('/products/{product}/images', [ProductImageController::class, 'upload']);
    Route::patch('/products/{product}/images/{image}/set-primary', [ProductImageController::class, 'setPrimary']);
    Route::delete('/products/{product}/images/{image}', [ProductImageController::class, 'destroy']);

    // Offers & Discounts
    Route::post('/offers/validate', [OfferController::class, 'validateOffer']);
    Route::apiResource('offers', OfferController::class);
    Route::patch('/offers/{offer}/toggle-status', [OfferController::class, 'toggleStatus']);

    // Combo Meals
    Route::apiResource('combos', ComboController::class);
    Route::post('/combos/{combo}/duplicate', [ComboController::class, 'duplicate']);
    Route::patch('/combos/{combo}/toggle-status', [ComboController::class, 'toggleStatus']);
    Route::patch('/combos/{combo}/toggle-availability', [ComboController::class, 'toggleAvailability']);

    // Dining Tables
    Route::apiResource('tables', DiningTableController::class);
    Route::patch('/tables/{table}/toggle-status', [DiningTableController::class, 'toggleStatus']);

    // Orders & POS Checkout
    Route::get('/orders/z-report', [OrderController::class, 'zReport']);
    Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show']);
});
