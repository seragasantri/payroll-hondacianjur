<?php

namespace App\Policies;

use App\Models\KantorCabang;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class KantorCabangPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('kantor-cabang.view any') || $user->can('kantor-cabang.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, KantorCabang $kantorCabang): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('kantor-cabang.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('kantor-cabang.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, KantorCabang $kantorCabang): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('kantor-cabang.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, KantorCabang $kantorCabang): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('kantor-cabang.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, KantorCabang $kantorCabang): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('kantor-cabang.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, KantorCabang $kantorCabang): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('kantor-cabang.delete');
    }
}
