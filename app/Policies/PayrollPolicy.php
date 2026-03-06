<?php

namespace App\Policies;

use App\Models\Payroll;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PayrollPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('payroll.view any') || $user->is_super_admin;
    }

    public function view(User $user, Payroll $payroll): bool
    {
        return $user->hasPermissionTo('payroll.view') || $user->is_super_admin;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('payroll.create') || $user->is_super_admin;
    }

    public function update(User $user, Payroll $payroll): bool
    {
        return $user->hasPermissionTo('payroll.update') || $user->is_super_admin;
    }

    public function delete(User $user, Payroll $payroll): bool
    {
        return $user->hasPermissionTo('payroll.delete') || $user->is_super_admin;
    }

    public function generate(User $user): bool
    {
        return $user->hasPermissionTo('payroll.generate') || $user->is_super_admin;
    }

    public function publish(User $user): bool
    {
        return $user->hasPermissionTo('payroll.publish') || $user->is_super_admin;
    }
}
