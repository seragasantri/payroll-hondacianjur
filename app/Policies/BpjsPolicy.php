<?php

namespace App\Policies;

use App\Models\Bpjs;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BpjsPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('bpjs.view any') || $user->can('bpjs.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Bpjs $bpjs): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('bpjs.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('bpjs.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Bpjs $bpjs): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('bpjs.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Bpjs $bpjs): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('bpjs.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Bpjs $bpjs): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('bpjs.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Bpjs $bpjs): bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return $user->can('bpjs.delete');
    }
}
