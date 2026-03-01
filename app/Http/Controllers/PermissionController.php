<?php

namespace App\Http\Controllers;

use App\Http\Requests\PermissionStoreRequest;
use App\Http\Requests\PermissionUpdateRequest;
use App\Http\Resources\PermissionResource;
use App\Services\PermissionServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    protected $permissionServices;

    public function __construct()
    {
        $this->permissionServices = new PermissionServices;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Check authorization using Gate and PermissionPolicy
        Gate::authorize('viewAny', Permission::class);

        $searchName = $request->input('searchName');
        $searchModule = $request->input('searchModule');
        $sortField = $request->input('sortField', 'name');
        $sortDirection = $request->input('sortDirection', 'asc');

        $query = $this->permissionServices->getAll();

        // Filter by nama
        if ($searchName) {
            $query->where('name', 'like', "%{$searchName}%");
        }

        // Filter by module
        if ($searchModule) {
            $query->where('module', 'like', "%{$searchModule}%");
        }

        // Sorting
        $query->orderBy($sortField, $sortDirection);

        $permissions = $query->with('roles')->paginate(10);

        return Inertia::render('permissions/index', [
            'permissions' => PermissionResource::collection($permissions)
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Check authorization using Gate and PermissionPolicy
        Gate::authorize('create', Permission::class);

        return Inertia::render('permissions/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(PermissionStoreRequest $request)
    {
        // Check authorization using Gate and PermissionPolicy
        Gate::authorize('create', Permission::class);

        $this->permissionServices->create($request->validated());

        return redirect()->route('permissions.index')
            ->with('success', 'Permission berhasil dibuat!');
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
        $permission = $this->permissionServices->findId($id);

        // Check authorization using Gate and PermissionPolicy
        Gate::authorize('update', $permission);

        return Inertia::render('permissions/edit', [
            'permission' => new PermissionResource($permission)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PermissionUpdateRequest $request, $id)
    {
        $permission = $this->permissionServices->findId($id);

        // Check authorization using Gate and PermissionPolicy
        Gate::authorize('update', $permission);

        $this->permissionServices->update($id, $request->validated());

        return redirect()->route('permissions.index')
            ->with('success', 'Permission berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $permission = $this->permissionServices->findId($id);

        // Check authorization using Gate and PermissionPolicy
        Gate::authorize('delete', $permission);

        $this->permissionServices->delete($id);

        return to_route('permissions.index');
    }
}
