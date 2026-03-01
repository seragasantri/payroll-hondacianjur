<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EmployeePolicy
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

        return $user->can('employees.view any') || $user->can('employees.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Employee $employee): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return $user->can('employees.view any') || $user->can('employees.view');
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

        return $user->can('employees.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Employee $employee): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return $user->can('employees.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Employee $employee): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        if ($user->can('employees.delete')) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Employee $employee): bool
    {
        // Super admin can access everything
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return $user->can('employees.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Employee $employee): bool
    {
        // Force delete hanya untuk super admin
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return false;
    }
}
