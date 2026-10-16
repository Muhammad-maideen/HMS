<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class ClientRequestController extends Controller
{
    /**
     * Display a listing of client requests (for Admin Panel).
     */
    public function index(Request $request)
    {
        $query = ClientRequest::query();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('restaurant_name', 'like', "%{$search}%")
                  ->orWhere('owner_name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        // Get aggregate counts
        $counts = [
            'total' => ClientRequest::count(),
            'pending' => ClientRequest::where('status', 'pending')->count(),
            'approved' => ClientRequest::where('status', 'approved')->count(),
            'rejected' => ClientRequest::where('status', 'rejected')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $requests,
            'counts' => $counts,
        ]);
    }

    /**
     * Client Registration: Triggers a permission request to the admin panel.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'restaurant_name' => 'required|string|max:255',
            'owner_name' => 'required|string|max:255',
            'username' => 'required|string|max:100|unique:client_requests,username',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'password' => 'required|string|min:4',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $clientRequest = ClientRequest::create([
            'restaurant_name' => trim($request->restaurant_name),
            'owner_name' => trim($request->owner_name),
            'username' => strtolower(trim($request->username)),
            'email' => strtolower(trim($request->email)),
            'phone' => $request->phone ? trim($request->phone) : null,
            'password' => Hash::make($request->password),
            'status' => 'pending', // Awaiting Admin Approval
            'role' => 'admin',
        ]);

        return response()->json([
            'success' => true,
            'status' => 'pending',
            'message' => 'Permission request submitted to Admin Panel. Once admitted by the administrator, you can log in.',
            'data' => [
                'id' => $clientRequest->id,
                'restaurant_name' => $clientRequest->restaurant_name,
                'owner_name' => $clientRequest->owner_name,
                'username' => $clientRequest->username,
                'email' => $clientRequest->email,
                'status' => $clientRequest->status,
                'created_at' => $clientRequest->created_at,
            ],
        ], 201);
    }

    /**
     * Check approval status for a client.
     */
    public function checkStatus(Request $request)
    {
        $identifier = strtolower(trim($request->query('identifier', '')));
        if (!$identifier) {
            return response()->json([
                'success' => false,
                'message' => 'Identifier (username or email) required.',
            ], 400);
        }

        $client = ClientRequest::where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if (!$client) {
            return response()->json([
                'success' => false,
                'message' => 'No registration found for this username or email.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $client->id,
                'restaurant_name' => $client->restaurant_name,
                'owner_name' => $client->owner_name,
                'username' => $client->username,
                'email' => $client->email,
                'status' => $client->status,
                'approved_at' => $client->approved_at,
            ],
        ]);
    }

    /**
     * Authenticate user with permission check.
     */
    public function login(Request $request)
    {
        $identifier = strtolower(trim($request->identifier));
        $password = $request->password;

        if (!$identifier || !$password) {
            return response()->json([
                'success' => false,
                'message' => 'Username and password are required.',
            ], 422);
        }

        // Master Admin bypass
        if ($identifier === 'admin' && ($password === 'admin' || $password === 'admin123')) {
            return response()->json([
                'success' => true,
                'message' => 'Master Admin access granted.',
                'data' => [
                    'tenant_id' => 'tenant-master',
                    'restaurant_name' => 'AL RIZQ ELITE',
                    'owner_name' => 'Super Administrator',
                    'username' => 'admin',
                    'email' => 'admin@alrizq.com',
                    'role' => 'admin',
                    'status' => 'approved',
                ],
            ]);
        }

        // Find registered client request
        $client = ClientRequest::where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if (!$client) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid username or password. If you are a new client, please register below.',
            ], 401);
        }

        // Verify password
        if (!Hash::check($password, $client->password) && $password !== $client->password) {
            return response()->json([
                'success' => false,
                'message' => 'Incorrect password.',
            ], 401);
        }

        // Check Permission Status
        if ($client->status === 'pending') {
            return response()->json([
                'success' => false,
                'is_pending' => true,
                'status' => 'pending',
                'message' => "Access Pending: Your registration for '{$client->restaurant_name}' has been submitted. Please wait for the Super Admin to admit your account.",
                'data' => [
                    'id' => $client->id,
                    'restaurant_name' => $client->restaurant_name,
                    'owner_name' => $client->owner_name,
                    'username' => $client->username,
                    'status' => 'pending',
                ],
            ], 403);
        }

        if ($client->status === 'rejected') {
            return response()->json([
                'success' => false,
                'is_rejected' => true,
                'status' => 'rejected',
                'message' => "Access Denied: Your registration request was declined by the administrator. Please contact support.",
            ], 403);
        }

        // Approved client login
        return response()->json([
            'success' => true,
            'message' => "Welcome back, {$client->restaurant_name}!",
            'data' => [
                'tenant_id' => "tenant-{$client->id}",
                'restaurant_name' => $client->restaurant_name,
                'owner_name' => $client->owner_name,
                'username' => $client->username,
                'email' => $client->email,
                'role' => $client->role ?? 'admin',
                'status' => 'approved',
            ],
        ]);
    }

    /**
     * Admin Action: Admit & Approve a client.
     */
    public function approve(Request $request, $id)
    {
        $client = ClientRequest::findOrFail($id);
        $client->update([
            'status' => 'approved',
            'approved_at' => now(),
            'admin_notes' => $request->admin_notes ?? 'Admitted by Super Admin',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Client '{$client->restaurant_name}' has been admitted! They can now log in.",
            'data' => $client,
        ]);
    }

    /**
     * Admin Action: Reject a client request.
     */
    public function reject(Request $request, $id)
    {
        $client = ClientRequest::findOrFail($id);
        $client->update([
            'status' => 'rejected',
            'admin_notes' => $request->admin_notes ?? 'Declined by Administrator',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Client request for '{$client->restaurant_name}' has been declined.",
            'data' => $client,
        ]);
    }

    /**
     * Admin Action: Delete a request.
     */
    public function destroy($id)
    {
        $client = ClientRequest::findOrFail($id);
        $name = $client->restaurant_name;
        $client->delete();

        return response()->json([
            'success' => true,
            'message' => "Client request for '{$name}' was deleted.",
        ]);
    }
}
