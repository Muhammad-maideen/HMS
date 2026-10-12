<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageController extends Controller
{
    public function index(Product $product): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $product->images()->orderBy('sort_order')->get(),
        ]);
    }

    public function upload(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,gif|max:5120', // Max 5MB
            'is_primary' => 'nullable|boolean',
        ]);

        $file = $request->file('image');
        $fileName = Str::random(20) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('products', $fileName, 'public');

        $fullUrl = asset('storage/' . $path);
        $isPrimary = $request->boolean('is_primary') || $product->images()->count() === 0;

        if ($isPrimary) {
            ProductImage::where('product_id', $product->id)->update(['is_primary' => false]);
            $product->update(['image_url' => $fullUrl]);
        }

        $productImage = ProductImage::create([
            'product_id' => $product->id,
            'image_path' => $fullUrl,
            'original_name' => $file->getClientOriginalName(),
            'file_size_kb' => (int) round($file->getSize() / 1024),
            'is_primary' => $isPrimary,
            'sort_order' => $product->images()->count() + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Image uploaded and processed safely',
            'data' => $productImage,
        ], 201);
    }

    public function setPrimary(Product $product, ProductImage $image): JsonResponse
    {
        if ($image->product_id !== $product->id) {
            return response()->json(['success' => false, 'message' => 'Invalid image for product'], 403);
        }

        ProductImage::where('product_id', $product->id)->update(['is_primary' => false]);
        $image->update(['is_primary' => true]);
        $product->update(['image_url' => $image->image_path]);

        return response()->json([
            'success' => true,
            'message' => 'Primary product image updated',
            'data' => $image,
        ]);
    }

    public function destroy(Product $product, ProductImage $image): JsonResponse
    {
        if ($image->product_id !== $product->id) {
            return response()->json(['success' => false, 'message' => 'Invalid image for product'], 403);
        }

        // Delete from storage if local
        if (str_contains($image->image_path, 'storage/products/')) {
            $relativePath = str_replace(asset('storage/'), '', $image->image_path);
            Storage::disk('public')->delete($relativePath);
        }

        $wasPrimary = $image->is_primary;
        $image->delete();

        // If primary was deleted, set next available image as primary
        if ($wasPrimary) {
            $nextImage = $product->images()->first();
            if ($nextImage) {
                $nextImage->update(['is_primary' => true]);
                $product->update(['image_url' => $nextImage->image_path]);
            } else {
                $product->update(['image_url' => null]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully',
        ]);
    }
}
