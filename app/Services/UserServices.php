<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class UserServices
{
    public function getAll()
    {
        return User::query();
    }

    public function create($data)
    {
        $user = User::create([
            'name' => $data['name'],
            'username' => $data['username'],
            'password' => bcrypt($data['password']),
        ]);

        // Assign roles jika ada
        if (isset($data['roles'])) {
            $user->syncRoles($data['roles']);
        }

        return $user;
    }

    public function findId($id)
    {
        try {
            $user = User::findOrFail($id);
            return $user;
        } catch (ModelNotFoundException $e) {
            throw new \Exception('User dengan ID ' . $id . ' tidak ditemukan', 404);
        }
    }

    public function update($id, $data)
    {
        $user = $this->findId($id);

        $updateData = [
            'name' => $data['name'],
            'username' => $data['username'],
        ];

        // Update password hanya jika diisi
        if (isset($data['password']) && !empty($data['password'])) {
            $updateData['password'] = bcrypt($data['password']);
        }

        $user->update($updateData);

        // Update roles jika ada
        if (isset($data['roles'])) {
            $user->syncRoles($data['roles']);
        }

        return $user;
    }

    public function delete($id)
    {
        $user = $this->findId($id);
        return $user->delete();
    }
}
