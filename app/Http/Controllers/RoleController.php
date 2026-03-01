<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleStoreRequest;
use App\Http\Requests\RoleUpdateRequest;
use App\Http\Resources\RoleResource;
use App\Services\RoleServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    protected $roleServices;

    public function __construct()
    {
        $this->roleServices = new RoleServices;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Check authorization using Gate and RolePolicy
        Gate::authorize('viewAny', Role::class);

        $searchName = $request->input('searchName');
        $sortField = $request->input('sortField', 'name');
        $sortDirection = $request->input('sortDirection', 'asc');

        $query = $this->roleServices->getAll();

        // Filter by nama
        if ($searchName) {
            $query->where('name', 'like', "%{$searchName}%");
        }

        // Sorting
        $query->orderBy($sortField, $sortDirection);

        $roles = $query->with('permissions')->paginate(10);

        return Inertia::render('roles/index', [
            'roles' => RoleResource::collection($roles)
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Check authorization using Gate and RolePolicy
        Gate::authorize('create', Role::class);

        // Get all permissions for the form
        $permissions = Permission::pluck('name')->toArray();

        return Inertia::render('roles/create', [
            'allPermissions' => $permissions
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RoleStoreRequest $request)
    {
        // Check authorization using Gate and RolePolicy
        Gate::authorize('create', Role::class);

        $role = $this->roleServices->create($request->validated());

        // Sync permissions to role
        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return redirect()->route('roles.index')
            ->with('success', 'Role berhasil dibuat!');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        // Check authorization using Gate and RolePolicy
        $role = $this->roleServices->findId($id);
        Gate::authorize('update', $role);

        // Load role permissions
        $role->load('permissions');

        // Get role permissions as array
        $rolePermissions = $role->permissions->pluck('name')->toArray();

        return Inertia::render('roles/edit', [
            'role' => new RoleResource($role),
            'rolePermissions' => $rolePermissions
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RoleUpdateRequest $request, $id)
    {
        $role = $this->roleServices->findId($id);

        // Check authorization using Gate and RolePolicy
        Gate::authorize('update', $role);

        $this->roleServices->update($id, $request->validated());

        // Sync permissions to role
        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return redirect()->route('roles.index')
            ->with('success', 'Role berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $role = $this->roleServices->findId($id);

        // Check authorization using Gate and RolePolicy
        Gate::authorize('delete', $role);

        $this->roleServices->delete($id);

        return to_route('roles.index');
    }
}
