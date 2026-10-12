<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Products
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->index();
            $table->string('sku')->unique();
            $table->text('description')->nullable();
            $table->decimal('base_price', 10, 2);
            $table->decimal('offer_price', 10, 2)->nullable();
            $table->decimal('dine_in_price', 10, 2)->nullable();
            $table->decimal('takeaway_price', 10, 2)->nullable();
            $table->decimal('delivery_price', 10, 2)->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_bestseller')->default(false);
            $table->boolean('is_new_arrival')->default(false);
            $table->boolean('is_todays_special')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_available')->default(true);
            $table->integer('stock_quantity')->default(100);
            $table->string('image_url')->nullable();
            $table->timestamps();
        });

        // Product Variants (e.g. Half, Full, Family Pack)
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('variant_name');
            $table->string('sku')->nullable();
            $table->decimal('regular_price', 10, 2);
            $table->decimal('offer_price', 10, 2)->nullable();
            $table->decimal('dine_in_price', 10, 2)->nullable();
            $table->decimal('takeaway_price', 10, 2)->nullable();
            $table->decimal('delivery_price', 10, 2)->nullable();
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });

        // Multiple Product Images
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('image_path');
            $table->string('original_name')->nullable();
            $table->integer('file_size_kb')->default(0);
            $table->boolean('is_primary')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Offers and Discounts
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->enum('discount_type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('discount_value', 10, 2);
            $table->decimal('min_order_amount', 10, 2)->default(0);
            $table->decimal('max_discount_amount', 10, 2)->nullable();
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->string('badge_text')->default('Special Offer');
            $table->enum('target_type', ['all', 'category', 'product'])->default('all');
            $table->json('target_ids')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Combo Meals
        Schema::create('combos', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->index();
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->decimal('regular_price', 10, 2);
            $table->decimal('combo_price', 10, 2);
            $table->decimal('customer_savings', 10, 2);
            $table->string('badge_text')->default('Combo Saver');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_available')->default(true);
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();
            $table->timestamps();
        });

        // Combo Component Items
        Schema::create('combo_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('combo_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->integer('quantity')->default(1);
            $table->boolean('is_optional')->default(false);
            $table->string('substitution_notes')->nullable();
            $table->timestamps();
        });

        // Orders (for POS checkout & historical immutability verification)
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->enum('order_type', ['dine_in', 'takeaway', 'delivery'])->default('dine_in');
            $table->string('table_number')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('discount_total', 10, 2)->default(0);
            $table->foreignId('applied_offer_id')->nullable()->constrained('offers')->nullOnDelete();
            $table->string('applied_offer_code')->nullable();
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('final_total', 10, 2);
            $table->string('payment_method')->default('cash');
            $table->enum('payment_status', ['paid', 'pending'])->default('paid');
            $table->enum('order_status', ['completed', 'preparing', 'cancelled'])->default('completed');
            $table->string('created_by_role')->default('cashier');
            $table->timestamps();
        });

        // Order Items (Preserves historical snapshots: name, price, discount at time of purchase)
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('combo_id')->nullable();
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->enum('item_type', ['product', 'combo'])->default('product');
            $table->string('item_name');
            $table->string('variant_name')->nullable();
            $table->decimal('unit_price', 10, 2);
            $table->decimal('offer_price', 10, 2)->nullable();
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->integer('quantity');
            $table->decimal('line_total', 10, 2);
            $table->string('special_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('combo_items');
        Schema::dropIfExists('combos');
        Schema::dropIfExists('offers');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
