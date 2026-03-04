<?php

namespace App\Services;

use App\Models\Jabatan;
use Illuminate\Support\Facades\DB;

class JabatanServices
{
    protected $model;

    public function __construct()
    {
        $this->model = new Jabatan();
    }

    /**
     * Get all jabatan
     */
    public function getAll()
    {
        return $this->model->newQuery();
    }

    /**
     * Find jabatan by ID
     */
    public function findId($id)
    {
        return $this->model->findOrFail($id);
    }

    /**
     * Create new jabatan
     */
    public function create(array $data)
    {
        DB::beginTransaction();
        try {
            $jabatan = $this->model->create([
                'name' => $data['name'],
            ]);
            DB::commit();
            return $jabatan;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update jabatan
     */
    public function update($id, array $data)
    {
        DB::beginTransaction();
        try {
            $jabatan = $this->findId($id);
            $jabatan->update([
                'name' => $data['name'] ?? $jabatan->name,
            ]);
            DB::commit();
            return $jabatan;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete jabatan
     */
    public function delete($id)
    {
        DB::beginTransaction();
        try {
            $jabatan = $this->findId($id);
            $jabatan->delete();
            DB::commit();
            return $jabatan;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
