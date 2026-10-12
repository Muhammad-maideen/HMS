<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRestaurantRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$allowedRoles): Response
    {
        $currentRole = strtolower($request->header('X-User-Role', 'admin'));

        // If specific roles required for a route
        if (!empty($allowedRoles) && !in_array($currentRole, $allowedRoles)) {
            return response()->json([
                'success' => false,
                'message' => "Access denied: Your current role ('{$currentRole}') does not have permission to perform this action.",
                'required_roles' => $allowedRoles,
                'current_role' => $currentRole,
            ], 403);
        }

        // Mutation guard for Cashier and Kitchen Staff on menu/pricing/offers/combos
        $isMutating = in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE']);
        $isOrderCreation = $request->is('api/orders') && $request->isMethod('POST');

        if ($isMutating && !$isOrderCreation) {
            if ($currentRole === 'cashier' || $currentRole === 'kitchen') {
                return response()->json([
                    'success' => false,
                    'message' => "Permission Denied: Staff role '{$currentRole}' is restricted to view-only. Modifications to products, prices, offers, and combos require Manager or Admin/Owner authorization.",
                    'current_role' => $currentRole,
                ], 403);
            }
        }

        return $next($request);
    }
}
