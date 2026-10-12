<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'variants', 'images']);

        // Search by name, SKU, or description
        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('sku', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        // Filter by availability (in stock / out of stock)
        if ($request->has('is_available') && $request->input('is_available') !== '') {
            $query->where('is_available', $request->boolean('is_available'));
        }

        // Filter by active status
        if ($request->has('is_active') && $request->input('is_active') !== '') {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by tags / flags
        if ($request->boolean('is_featured')) {
            $query->where('is_featured', true);
        }
        if ($request->boolean('is_bestseller')) {
            $query->where('is_bestseller', true);
        }
        if ($request->boolean('is_new_arrival')) {
            $query->where('is_new_arrival', true);
        }
        if ($request->boolean('is_todays_special')) {
            $query->where('is_todays_special', true);
        }
        if ($request->boolean('has_offer')) {
            $query->whereNotNull('offer_price')->whereColumn('offer_price', '<', 'base_price');
        }

        // Sort
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $allowedSorts = ['name', 'base_price', 'created_at', 'stock_quantity'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Pagination or all
        if ($request->boolean('all')) {
            $products = $query->get();
            return response()->json([
                'success' => true,
                'data' => $products,
                'total' => $products->count(),
            ]);
        }

        $perPage = min((int) $request->input('per_page', 10), 100);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $paginated->items(),
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:150',
            'sku' => 'nullable|string|max:50|unique:products,sku',
            'description' => 'nullable|string',
            'base_price' => 'required|numeric|min:0.01',
            'offer_price' => 'nullable|numeric|lt:base_price|min:0',
            'dine_in_price' => 'nullable|numeric|min:0',
            'takeaway_price' => 'nullable|numeric|min:0',
            'delivery_price' => 'nullable|numeric|min:0',
            'is_featured' => 'boolean',
            'is_bestseller' => 'boolean',
            'is_new_arrival' => 'boolean',
            'is_todays_special' => 'boolean',
            'is_active' => 'boolean',
            'is_available' => 'boolean',
            'stock_quantity' => 'integer|min:0',
            'image_url' => 'nullable|string',
            'variants' => 'nullable|array',
            'variants.*.variant_name' => 'required_with:variants|string|max:100',
            'variants.*.sku' => 'nullable|string|max:50',
            'variants.*.regular_price' => 'required_with:variants|numeric|min:0.01',
            'variants.*.offer_price' => 'nullable|numeric|min:0',
            'variants.*.dine_in_price' => 'nullable|numeric|min:0',
            'variants.*.takeaway_price' => 'nullable|numeric|min:0',
            'variants.*.delivery_price' => 'nullable|numeric|min:0',
            'variants.*.is_available' => 'boolean',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $slug = Str::slug($validated['name']);
            if (Product::where('slug', $slug)->exists()) {
                $slug .= '-' . Str::random(5);
            }
            $validated['slug'] = $slug;

            if (empty($validated['sku'])) {
                $validated['sku'] = 'AR-' . strtoupper(Str::random(6));
            }

            // Defaults
            $validated['dine_in_price'] = $validated['dine_in_price'] ?? $validated['base_price'];
            $validated['takeaway_price'] = $validated['takeaway_price'] ?? $validated['base_price'];
            $validated['delivery_price'] = $validated['delivery_price'] ?? ($validated['base_price'] * 1.1);

            $variants = $validated['variants'] ?? [];
            unset($validated['variants']);

            $product = Product::create($validated);

            // Save variants
            foreach ($variants as $v) {
                $product->variants()->create($v);
            }

            // If image_url provided, create primary product image record
            if (!empty($product->image_url)) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $product->image_url,
                    'original_name' => $product->name,
                    'file_size_kb' => 200,
                    'is_primary' => true,
                    'sort_order' => 1,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully',
                'data' => $product->load(['category', 'variants', 'images']),
            ], 201);
        });
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $product->load(['category', 'variants', 'images']),
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'sometimes|required|exists:categories,id',
            'name' => 'sometimes|required|string|max:150',
            'sku' => 'sometimes|required|string|max:50|unique:products,sku,' . $product->id,
            'description' => 'nullable|string',
            'base_price' => 'sometimes|required|numeric|min:0.01',
            'offer_price' => 'nullable|numeric|min:0',
            'dine_in_price' => 'nullable|numeric|min:0',
            'takeaway_price' => 'nullable|numeric|min:0',
            'delivery_price' => 'nullable|numeric|min:0',
            'is_featured' => 'boolean',
            'is_bestseller' => 'boolean',
            'is_new_arrival' => 'boolean',
            'is_todays_special' => 'boolean',
            'is_active' => 'boolean',
            'is_available' => 'boolean',
            'stock_quantity' => 'integer|min:0',
            'image_url' => 'nullable|string',
            'variants' => 'nullable|array',
            'variants.*.id' => 'nullable|integer',
            'variants.*.variant_name' => 'required_with:variants|string|max:100',
            'variants.*.sku' => 'nullable|string|max:50',
            'variants.*.regular_price' => 'required_with:variants|numeric|min:0.01',
            'variants.*.offer_price' => 'nullable|numeric|min:0',
            'variants.*.dine_in_price' => 'nullable|numeric|min:0',
            'variants.*.takeaway_price' => 'nullable|numeric|min:0',
            'variants.*.delivery_price' => 'nullable|numeric|min:0',
            'variants.*.is_available' => 'boolean',
        ]);

        return DB::transaction(function () use ($validated, $product) {
            if (isset($validated['name']) && $validated['name'] !== $product->name) {
                $slug = Str::slug($validated['name']);
                if (Product::where('slug', $slug)->where('id', '!=', $product->id)->exists()) {
                    $slug .= '-' . Str::random(5);
                }
                $validated['slug'] = $slug;
            }

            // Validate offer price against base price
            $effectiveBasePrice = $validated['base_price'] ?? $product->base_price;
            if (isset($validated['offer_price']) && $validated['offer_price'] >= $effectiveBasePrice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Offer price must be less than the regular selling price (' . $effectiveBasePrice . ').',
                ], 422);
            }

            $variants = $validated['variants'] ?? null;
            unset($validated['variants']);

            $product->update($validated);

            if ($variants !== null) {
                $sentIds = [];
                foreach ($variants as $vData) {
                    if (!empty($vData['id'])) {
                        $variant = ProductVariant::where('product_id', $product->id)->find($vData['id']);
                        if ($variant) {
                            $variant->update($vData);
                            $sentIds[] = $variant->id;
                        }
                    } else {
                        $newVariant = $product->variants()->create($vData);
                        $sentIds[] = $newVariant->id;
                    }
                }
                // Remove variants not sent
                $product->variants()->whereNotIn('id', $sentIds)->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully',
                'data' => $product->fresh(['category', 'variants', 'images']),
            ]);
        });
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }

    public function toggleStatus(Product $product): JsonResponse
    {
        $product->is_active = !$product->is_active;
        $product->save();

        return response()->json([
            'success' => true,
            'message' => $product->is_active ? 'Product activated' : 'Product deactivated',
            'data' => $product,
        ]);
    }

    public function toggleAvailability(Product $product): JsonResponse
    {
        $product->is_available = !$product->is_available;
        $product->save();

        return response()->json([
            'success' => true,
            'message' => $product->is_available ? 'Product marked as In Stock' : 'Product marked as Out of Stock',
            'data' => $product,
        ]);
    }

    public function bulkAvailability(Request $request): JsonResponse
    {
        $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'is_available' => 'required|boolean',
        ]);

        Product::whereIn('id', $request->input('product_ids'))
            ->update(['is_available' => $request->boolean('is_available')]);

        return response()->json([
            'success' => true,
            'message' => 'Bulk availability updated successfully',
        ]);
    }
}
