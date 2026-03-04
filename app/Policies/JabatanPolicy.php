<?php

namespace App\Policies;

use App\Models\Jabatan;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class JabatanPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('jabatan.view any') || $user->can('jabatan.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Jabatan $jabatan): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('jabatan.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('jabatan.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Jabatan $jabatan): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('jabatan.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Jabatan $jabatan): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('jabatan.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Jabatan $jabatan): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('jabatan.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Jabatan $jabatan): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('jabatan.delete');
    }
}
