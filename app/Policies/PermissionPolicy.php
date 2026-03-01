<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Spatie\Permission\Models\Permission;

class PermissionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Debug log
        \Log::info('PermissionPolicy::viewAny', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'roles' => $user->roles->pluck('name')->toArray(),
            'has_super_admin' => $user->hasRole('Super Admin'),
        ]);

        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return $user->can('permissions.view any') || $user->can('permissions.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Permission $permission): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return $user->can('permissions.view any') || $user->can('permissions.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return $user->can('permissions.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Permission $permission): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return $user->can('permissions.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Permission $permission): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        if ($user->can('permissions.delete')) {
            // Cegah hapus permission yang sedang digunakan oleh role aktif
            // (Optional: bisa ditambahkan logic tambahan jika perlu)
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Permission $permission): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return $user->can('permissions.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Permission $permission): bool
    {
        // Force delete permissions hanya untuk super admin
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return false;
    }
}
