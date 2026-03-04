<?php

namespace App\Policies;

use App\Models\Tunjangan;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TunjanganPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('tunjangan.view any') || $user->can('tunjangan.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Tunjangan $tunjangan): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('tunjangan.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('tunjangan.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Tunjangan $tunjangan): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('tunjangan.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Tunjangan $tunjangan): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('tunjangan.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Tunjangan $tunjangan): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('tunjangan.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Tunjangan $tunjangan): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('tunjangan.delete');
    }
}
