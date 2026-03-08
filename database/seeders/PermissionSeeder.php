<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $modules = [
            'users' => ['view', 'view any', 'create', 'edit', 'delete'],
            'roles' => ['view', 'view any', 'create', 'edit', 'delete'],
            'permissions' => ['view', 'view any', 'create', 'edit', 'delete'],
            'tunjangan' => ['view', 'view any', 'create', 'edit', 'delete'],
            'payroll' => ['view', 'view any', 'create', 'edit', 'delete'],
            'kantor-cabang' => ['view', 'view any', 'create', 'edit', 'delete'],
            'jabatan' => ['view', 'view any', 'create', 'edit', 'delete'],
            'settings' => ['view', 'edit'],
        ];

        foreach ($modules as $moduleName => $actions) {
            foreach ($actions as $action) {
                $permissionName = "{$moduleName}.{$action}";

                // Update atau create permission dengan module
                $permission = Permission::where('name', $permissionName)->first();

                if ($permission) {
                    $permission->update(['module' => $moduleName]);
                } else {
                    Permission::create([
                        'name' => $permissionName,
                        'guard_name' => 'web',
                        'module' => $moduleName,
                    ]);
                }
            }
        }

        $this->command->info('Permissions seeded successfully.');
    }
}
