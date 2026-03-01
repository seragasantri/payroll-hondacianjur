<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return $user->can('users.view any') || $user->can('users.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        // User bisa view user lain jika punya permission users.view any atau users.view
        if ($user->can('users.view any') || $user->can('users.view')) {
            return true;
        }

        // User bisa view data dirinya sendiri
        if ($user->id === $model->id) {
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

        return $user->can('users.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            // Super admin cannot edit another Super Admin
            if ($model->hasRole('Super Admin') && !$user->is($model)) {
                return false;
            }
            return true;
        }

        // User bisa update user lain jika punya permission users.edit
        if ($user->can('users.edit')) {
            // Cegah user edit Super Admin kecuali dia sendiri adalah Super Admin
            if ($model->hasRole('Super Admin') && !$user->is($model)) {
                return false;
            }
            return true;
        }

        // User bisa update data dirinya sendiri
        if ($user->id === $model->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, User $model): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            // Super admin cannot delete self or other Super Admins
            if ($user->id === $model->id) {
                return false;
            }
            if ($model->hasRole('Super Admin')) {
                return false;
            }
            return true;
        }

        // User bisa delete user lain jika punya permission users.delete
        if ($user->can('users.delete')) {
            // Cegah hapus diri sendiri
            if ($user->id === $model->id) {
                return false;
            }

            // Cegah hapus Super Admin
            if ($model->hasRole('Super Admin')) {
                return false;
            }

            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, User $model): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        // Restore biasanya bagian dari delete permission
        if ($user->can('users.delete')) {
            // Cegah restore Super Admin jika bukan Super Admin sendiri
            if ($model->hasRole('Super Admin') && !$user->hasRole('Super Admin')) {
                return false;
            }
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        // Force delete users hanya untuk Super Admin
        if ($user->hasRole('Super Admin')) {
            // Super Admin tidak bisa force delete diri sendiri
            if ($user->id === $model->id) {
                return false;
            }
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can manage roles of the model.
     */
    public function manageRoles(User $user, User $model): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            // Super admin cannot manage another Super Admin's roles
            if ($model->hasRole('Super Admin') && !$user->is($model)) {
                return false;
            }
            return true;
        }

        // User bisa manage roles user lain jika punya permission users.edit
        if ($user->can('users.edit')) {
            // Cegah ubah role Super Admin
            if ($model->hasRole('Super Admin') && !$user->is($model)) {
                return false;
            }
            return true;
        }

        return false;
    }
}
