<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiningTableController extends Controller
{
    /**
     * Display a listing of dining tables.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DiningTable::query();

        if ($request->filled('section')) {
            $query->where('section', $request->input('section'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $tables = $query->orderBy('code', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $tables,
        ]);
    }

    /**
     * Store a newly created dining table.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:dining_tables,code'],
            'name' => ['nullable', 'string', 'max:100'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:50'],
            'section' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:available,occupied,reserved'],
        ]);

        $table = DiningTable::create([
            'code' => strtoupper(trim($validated['code'])),
            'name' => $validated['name'] ?? $validated['code'],
            'capacity' => $validated['capacity'] ?? 4,
            'section' => $validated['section'] ?? 'Main Dining',
            'status' => $validated['status'] ?? 'available',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dining table created successfully',
            'data' => $table,
        ], 201);
    }

    /**
     * Display the specified dining table.
     */
    public function show(DiningTable $table): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $table,
        ]);
    }

    /**
     * Update the specified dining table.
     */
    public function update(Request $request, DiningTable $table): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'max:50', 'unique:dining_tables,code,' . $table->id],
            'name' => ['nullable', 'string', 'max:100'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:50'],
            'section' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:available,occupied,reserved'],
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $table->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Dining table updated successfully',
            'data' => $table,
        ]);
    }

    /**
     * Remove the specified dining table.
     */
    public function destroy(DiningTable $table): JsonResponse
    {
        $table->delete();

        return response()->json([
            'success' => true,
            'message' => 'Dining table deleted successfully',
        ]);
    }

    /**
     * Quick toggle table status (available/occupied).
     */
    public function toggleStatus(DiningTable $table): JsonResponse
    {
        $newStatus = $table->status === 'available' ? 'occupied' : 'available';
        $table->update(['status' => $newStatus]);

        return response()->json([
            'success' => true,
            'message' => "Table marked as {$newStatus}",
            'data' => $table,
        ]);
    }
}
