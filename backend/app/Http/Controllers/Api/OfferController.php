<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Offer::orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $status = $request->input('status');
            $now = Carbon::now();

            if ($status === 'active') {
                $query->where('is_active', true)
                      ->where('start_time', '<=', $now)
                      ->where('end_time', '>=', $now);
            } elseif ($status === 'scheduled') {
                $query->where('is_active', true)
                      ->where('start_time', '>', $now);
            } elseif ($status === 'expired') {
                $query->where('end_time', '<', $now);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if ($request->boolean('active_only')) {
            $now = Carbon::now();
            $query->where('is_active', true)
                  ->where('start_time', '<=', $now)
                  ->where('end_time', '>=', $now);
        }

        $offers = $query->get();

        return response()->json([
            'success' => true,
            'data' => $offers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'code' => 'required|string|max:30|unique:offers,code',
            'description' => 'nullable|string',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0.01',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'badge_text' => 'nullable|string|max:50',
            'target_type' => 'required|in:all,category,product',
            'target_ids' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['badge_text'] = $validated['badge_text'] ?? ($validated['discount_type'] === 'percentage' ? "{$validated['discount_value']}% OFF" : "₹{$validated['discount_value']} OFF");
        $validated['min_order_amount'] = $validated['min_order_amount'] ?? 0;

        $offer = Offer::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Offer created successfully',
            'data' => $offer,
        ], 201);
    }

    public function show(Offer $offer): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $offer,
        ]);
    }

    public function update(Request $request, Offer $offer): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:150',
            'code' => 'sometimes|required|string|max:30|unique:offers,code,' . $offer->id,
            'description' => 'nullable|string',
            'discount_type' => 'sometimes|required|in:percentage,fixed',
            'discount_value' => 'sometimes|required|numeric|min:0.01',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'start_time' => 'sometimes|required|date',
            'end_time' => 'sometimes|required|date|after:start_time',
            'badge_text' => 'nullable|string|max:50',
            'target_type' => 'sometimes|required|in:all,category,product',
            'target_ids' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $offer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Offer updated successfully',
            'data' => $offer,
        ]);
    }

    public function toggleStatus(Offer $offer): JsonResponse
    {
        $offer->is_active = !$offer->is_active;
        $offer->save();

        return response()->json([
            'success' => true,
            'message' => $offer->is_active ? 'Offer activated' : 'Offer deactivated',
            'data' => $offer,
        ]);
    }

    public function destroy(Offer $offer): JsonResponse
    {
        $offer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Offer deleted successfully',
        ]);
    }

    /**
     * Test / Validate offer against order subtotal
     */
    public function validateOffer(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $code = strtoupper(trim($request->input('code')));
        $subtotal = (float) $request->input('subtotal');

        $offer = Offer::where('code', $code)->first();

        if (!$offer) {
            return response()->json([
                'valid' => false,
                'message' => "Promo code '{$code}' does not exist.",
            ], 404);
        }

        if (!$offer->is_active) {
            return response()->json([
                'valid' => false,
                'message' => "Offer '{$offer->title}' has been disabled by management.",
            ], 422);
        }

        $now = Carbon::now();
        if ($now->lt($offer->start_time)) {
            return response()->json([
                'valid' => false,
                'message' => "Offer '{$offer->title}' has not started yet. Starts on " . $offer->start_time->format('d M Y, h:i A'),
            ], 422);
        }

        if ($now->gt($offer->end_time)) {
            return response()->json([
                'valid' => false,
                'message' => "Offer '{$offer->title}' expired on " . $offer->end_time->format('d M Y, h:i A'),
            ], 422);
        }

        if ($subtotal < $offer->min_order_amount) {
            $shortfall = $offer->min_order_amount - $subtotal;
            return response()->json([
                'valid' => false,
                'message' => "Minimum order value of ₹{$offer->min_order_amount} required. Add ₹{$shortfall} more to apply this offer.",
            ], 422);
        }

        $discount = $offer->calculateDiscount($subtotal);

        return response()->json([
            'valid' => true,
            'message' => "Offer '{$offer->title}' applied! Saved ₹{$discount}",
            'discount_amount' => $discount,
            'offer' => $offer,
        ]);
    }
}
