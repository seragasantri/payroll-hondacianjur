<?php

namespace App\Services;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Spatie\Permission\Models\Permission;

class PermissionServices
{
    /**
     * Get all permissions query builder
     */
    public function getAll()
    {
        return Permission::query();
    }

    /**
     * Create a new permission
     */
    public function create($data)
    {
        $permission = Permission::create([
            'name' => $data['name'],
            'guard_name' => $data['guard_name'] ?? 'web',
            'module' => $data['module'] ?? null,
        ]);

        return $permission;
    }

    /**
     * Find permission by ID
     */
    public function findId($id)
    {
        try {
            $permission = Permission::findOrFail($id);
            return $permission;
        } catch (ModelNotFoundException $e) {
            throw new \Exception('Permission dengan ID ' . $id . ' tidak ditemukan', 404);
        }
    }

    /**
     * Update permission
     */
    public function update($id, $data)
    {
        $permission = $this->findId($id);

        $updateData = [
            'name' => $data['name'],
        ];

        // Update guard_name jika ada
        if (isset($data['guard_name'])) {
            $updateData['guard_name'] = $data['guard_name'];
        }

        // Update module jika ada
        if (isset($data['module'])) {
            $updateData['module'] = $data['module'];
        }

        $permission->update($updateData);

        return $permission;
    }

    /**
     * Delete permission
     */
    public function delete($id)
    {
        $permission = $this->findId($id);
        return $permission->delete();
    }

    /**
     * Get all permissions grouped by module
     * Returns array like: ['users' => ['users.view', 'users.create', ...], ...]
     */
    public function getGroupedByModule()
    {
        $permissions = $this->getAll()->get();

        $grouped = [];

        foreach ($permissions as $permission) {
            // Extract module name from permission name (format: "module.action")
            $parts = explode('.', $permission->name);

            if (count($parts) >= 2) {
                $module = $parts[0];
                $grouped[$module][] = $permission->name;
            } else {
                // Permissions without dot
                $grouped['other'][] = $permission->name;
            }
        }

        return $grouped;
    }

    /**
     * Create or update permissions for a module
     */
    public function syncModulePermissions($module, array $actions)
    {
        $permissions = [];

        foreach ($actions as $action) {
            $permissionName = "{$module}.{$action}";

            // Create permission if not exists
            $permission = Permission::firstOrCreate(
                ['name' => $permissionName, 'guard_name' => 'web'],
                ['name' => $permissionName, 'guard_name' => 'web']
            );

            $permissions[] = $permission;
        }

        return $permissions;
    }
}
