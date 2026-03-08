<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
use App\Models\Employee;
use App\Models\Bpjs;
use App\Models\Payrolls;
use App\Models\Tunjangan;
use App\Policies\UserPolicy;
use App\Policies\RolePolicy;
use App\Policies\PermissionPolicy;
use App\Policies\EmployeePolicy;
use App\Policies\BpjsPolicy;
use App\Policies\PayrollPolicy;
use App\Policies\TunjanganPolicy;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class => UserPolicy::class,
        Role::class => RolePolicy::class,
        Permission::class => PermissionPolicy::class,
        Employee::class => EmployeePolicy::class,
        Tunjangan::class => TunjanganPolicy::class,
        Payrolls::class => PayrollPolicy::class
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Implicitly grant "Super Admin" role all permissions
        Gate::before(function ($user, $ability) {
            if ($user->hasRole('Super Admin')) {
                return true;
            }
        });
    }
}
