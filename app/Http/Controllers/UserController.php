<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use App\Http\Resources\UserResource;
use App\Services\UserServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    protected $userServices;

    public function __construct()
    {
        $this->userServices = new UserServices;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Check authorization using Gate and UserPolicy
        Gate::authorize('viewAny', \App\Models\User::class);

        $perPage = $request->get('perPage', 10);
        $searchName = $request->input('searchName');
        $searchUsername = $request->input('searchUsername');
        $sortField = $request->input('sortField', 'name');
        $sortDirection = $request->input('sortDirection', 'asc');

        $query = $this->userServices->getAll();

        // Filter by nama
        if ($searchName) {
            $query->where('name', 'like', "%{$searchName}%");
        }

        // Filter by username
        if ($searchUsername) {
            $query->where('username', 'like', "%{$searchUsername}%");
        }

        // Sorting
        if ($sortField === 'role') {
            // Sort by role name using subquery to avoid join conflicts
            $query->with('roles')
                ->orderByRaw(
                    '(SELECT name FROM roles JOIN model_has_roles ON roles.id = model_has_roles.role_id WHERE model_has_roles.model_id = users.id AND model_has_roles.model_type = "App\\\\Models\\\\User" LIMIT 1) ' .
                    $sortDirection
                );
        } else {
            // Sort by user fields
            $query->orderBy($sortField, $sortDirection);
        }

        $users = $query->with('roles')->paginate($perPage);

        return Inertia::render('users/index', [
            'users' => UserResource::collection($users)
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Check authorization using Gate and UserPolicy
        Gate::authorize('create', \App\Models\User::class);

        return Inertia::render('users/create', [
            'roles' => Role::all()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserStoreRequest $request)
    {
        // Check authorization using Gate and UserPolicy
        Gate::authorize('create', \App\Models\User::class);

        $user = $this->userServices->create($request->validated());
        $user->assignRole($request->roles);

        return redirect()->route('users.index')
            ->with('success', 'User berhasil dibuat!');
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $user = $this->userServices->findId($id);

        // Check authorization using Gate and UserPolicy
        Gate::authorize('update', $user);

        return Inertia::render('users/edit', [
            'user' => new UserResource($user->load('roles')),
            'roles' => Role::all()
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserUpdateRequest $request, $id)
    {
        $user = $this->userServices->findId($id);

        // Check authorization using Gate and UserPolicy
        Gate::authorize('update', $user);

        $this->userServices->update($id, $request->validated());
        $user->syncRoles($request->roles);

        return redirect()->route('users.index')
            ->with('success', 'User berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = $this->userServices->findId($id);

        // Check authorization using Gate and UserPolicy
        Gate::authorize('delete', $user);

        $this->userServices->delete($id);

        return to_route('users.index');
    }
}
