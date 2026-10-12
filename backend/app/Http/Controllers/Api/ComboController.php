<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Combo;
use App\Models\ComboItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ComboController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Combo::with(['items.product', 'items.variant'])->orderBy('created_at', 'desc');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true)->where('is_available', true);
        }

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $combos = $query->get();

        return response()->json([
            'success' => true,
            'data' => $combos,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'combo_price' => 'required|numeric|min:0.01',
            'regular_price' => 'nullable|numeric|min:0.01',
            'badge_text' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'is_available' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.is_optional' => 'boolean',
            'items.*.substitution_notes' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated) {
            $slug = Str::slug($validated['name']);
            if (Combo::where('slug', $slug)->exists()) {
                $slug .= '-' . Str::random(5);
            }
            $validated['slug'] = $slug;

            // Recalculate component regular price if not specified or to verify
            $calculatedRegularPrice = 0.0;
            foreach ($validated['items'] as $it) {
                $unitPrice = 0.0;
                if (!empty($it['variant_id'])) {
                    $variant = ProductVariant::find($it['variant_id']);
                    $unitPrice = $variant ? $variant->regular_price : 0.0;
                } else {
                    $prod = Product::find($it['product_id']);
                    $unitPrice = $prod ? $prod->base_price : 0.0;
                }
                $calculatedRegularPrice += ($unitPrice * $it['quantity']);
            }

            $regularPrice = !empty($validated['regular_price']) ? (float)$validated['regular_price'] : $calculatedRegularPrice;
            $comboPrice = (float)$validated['combo_price'];
            $savings = max(0.0, round($regularPrice - $comboPrice, 2));

            $items = $validated['items'];
            unset($validated['items']);

            $validated['regular_price'] = $regularPrice;
            $validated['customer_savings'] = $savings;
            $validated['badge_text'] = $validated['badge_text'] ?? "Save ₹{$savings}";

            $combo = Combo::create($validated);

            foreach ($items as $item) {
                $combo->items()->create($item);
            }

            return response()->json([
                'success' => true,
                'message' => 'Combo meal created successfully',
                'data' => $combo->load(['items.product', 'items.variant']),
            ], 201);
        });
    }

    public function show(Combo $combo): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $combo->load(['items.product', 'items.variant']),
        ]);
    }

    public function update(Request $request, Combo $combo): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'combo_price' => 'sometimes|required|numeric|min:0.01',
            'regular_price' => 'nullable|numeric|min:0.01',
            'badge_text' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'is_available' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'items' => 'nullable|array|min:1',
            'items.*.product_id' => 'required_with:items|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.is_optional' => 'boolean',
            'items.*.substitution_notes' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated, $combo) {
            if (isset($validated['name']) && $validated['name'] !== $combo->name) {
                $slug = Str::slug($validated['name']);
                if (Combo::where('slug', $slug)->where('id', '!=', $combo->id)->exists()) {
                    $slug .= '-' . Str::random(5);
                }
                $validated['slug'] = $slug;
            }

            $items = $validated['items'] ?? null;
            unset($validated['items']);

            if ($items !== null) {
                // Delete old items and re-add
                $combo->items()->delete();
                $calculatedRegularPrice = 0.0;
                foreach ($items as $it) {
                    $unitPrice = 0.0;
                    if (!empty($it['variant_id'])) {
                        $variant = ProductVariant::find($it['variant_id']);
                        $unitPrice = $variant ? $variant->regular_price : 0.0;
                    } else {
                        $prod = Product::find($it['product_id']);
                        $unitPrice = $prod ? $prod->base_price : 0.0;
                    }
                    $calculatedRegularPrice += ($unitPrice * $it['quantity']);
                    $combo->items()->create($it);
                }

                if (empty($validated['regular_price'])) {
                    $validated['regular_price'] = $calculatedRegularPrice;
                }
            }

            $regularPrice = $validated['regular_price'] ?? $combo->regular_price;
            $comboPrice = $validated['combo_price'] ?? $combo->combo_price;
            $validated['customer_savings'] = max(0.0, round($regularPrice - $comboPrice, 2));

            $combo->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Combo meal updated successfully',
                'data' => $combo->fresh(['items.product', 'items.variant']),
            ]);
        });
    }

    /**
     * Duplicate a combo meal
     */
    public function duplicate(Combo $combo): JsonResponse
    {
        return DB::transaction(function () use ($combo) {
            $clone = $combo->replicate();
            $clone->name = 'Copy of ' . $combo->name;
            $clone->slug = Str::slug($clone->name) . '-' . Str::random(5);
            $clone->save();

            foreach ($combo->items as $item) {
                $clone->items()->create([
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                    'is_optional' => $item->is_optional,
                    'substitution_notes' => $item->substitution_notes,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "Combo duplicated as '{$clone->name}'",
                'data' => $clone->load(['items.product', 'items.variant']),
            ], 201);
        });
    }

    public function toggleStatus(Combo $combo): JsonResponse
    {
        $combo->is_active = !$combo->is_active;
        $combo->save();

        return response()->json([
            'success' => true,
            'message' => $combo->is_active ? 'Combo activated' : 'Combo deactivated',
            'data' => $combo,
        ]);
    }

    public function toggleAvailability(Combo $combo): JsonResponse
    {
        $combo->is_available = !$combo->is_available;
        $combo->save();

        return response()->json([
            'success' => true,
            'message' => $combo->is_available ? 'Combo marked Available' : 'Combo marked Out of Stock',
            'data' => $combo,
        ]);
    }

    public function destroy(Combo $combo): JsonResponse
    {
        $combo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Combo meal deleted successfully',
        ]);
    }
}
