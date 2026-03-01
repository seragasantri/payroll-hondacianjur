<?php

namespace App\Services;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Spatie\Permission\Models\Role;

class RoleServices
{
    /**
     * Get all roles query builder
     */
    public function getAll()
    {
        return Role::query();
    }

    /**
     * Create a new role
     */
    public function create($data)
    {
        $role = Role::create([
            'name' => $data['name'],
            'guard_name' => $data['guard_name'] ?? 'web',
        ]);

        return $role;
    }

    /**
     * Find role by ID
     */
    public function findId($id)
    {
        try {
            $role = Role::findOrFail($id);
            return $role;
        } catch (ModelNotFoundException $e) {
            throw new \Exception('Role dengan ID ' . $id . ' tidak ditemukan', 404);
        }
    }

    /**
     * Update role
     */
    public function update($id, $data)
    {
        $role = $this->findId($id);

        $updateData = [
            'name' => $data['name'],
        ];

        // Update guard_name jika ada
        if (isset($data['guard_name'])) {
            $updateData['guard_name'] = $data['guard_name'];
        }

        $role->update($updateData);

        return $role;
    }

    /**
     * Delete role
     */
    public function delete($id)
    {
        $role = $this->findId($id);
        return $role->delete();
    }
}
