<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Debug log
        \Log::info('RolePolicy::viewAny', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'roles' => $user->roles->pluck('name')->toArray(),
            'has_super_admin' => $user->hasRole('Super Admin'),
        ]);

        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return $user->can('roles.view any') || $user->can('roles.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Role $role): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        // User bisa view role jika punya permission roles.view atau roles.view any
        if ($user->can('roles.view any') || $user->can('roles.view')) {
            return true;
        }

        return false;
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

        return $user->can('roles.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Role $role): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            // Super admin cannot edit another Super Admin's role
            if (strtolower($role->name) === 'super admin' && !$user->hasRole('Super Admin')) {
                return false;
            }
            return true;
        }

        // User bisa edit role jika punya permission roles.edit
        if ($user->can('roles.edit')) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Role $role): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            // Super admin cannot delete Super Admin role or self
            if (strtolower($role->name) === 'super admin' || $role->id === 1) {
                return false;
            }
            if ($user->hasRole($role->name)) {
                return false;
            }
            return true;
        }

        // User bisa delete role jika punya permission roles.delete
        if ($user->can('roles.delete')) {
            // Cegah hapus role Super Admin jika ada
            if (strtolower($role->name) === 'super admin' || $role->id === 1) {
                return false;
            }

            // Cegah hapus role sendiri
            if ($user->hasRole($role->name)) {
                return false;
            }

            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Role $role): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        // Biasanya restore adalah bagian dari delete permission
        return $user->can('roles.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Role $role): bool
    {
        // Force delete biasanya hanya untuk super admin
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return false;
    }
}
