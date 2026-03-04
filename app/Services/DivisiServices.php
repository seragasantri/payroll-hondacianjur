<?php

namespace App\Services;

use App\Models\Divisi;
use Illuminate\Support\Facades\DB;

class DivisiServices
{
    protected $model;

    public function __construct()
    {
        $this->model = new Divisi();
    }

    /**
     * Get all divisi
     */
    public function getAll()
    {
        return $this->model->newQuery();
    }

    /**
     * Find divisi by ID
     */
    public function findId($id)
    {
        return $this->model->findOrFail($id);
    }

    /**
     * Create new divisi
     */
    public function create(array $data)
    {
        DB::beginTransaction();
        try {
            $divisi = $this->model->create([
                'name' => $data['name'],
            ]);
            DB::commit();
            return $divisi;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update divisi
     */
    public function update($id, array $data)
    {
        DB::beginTransaction();
        try {
            $divisi = $this->findId($id);
            $divisi->update([
                'name' => $data['name'] ?? $divisi->name,
            ]);
            DB::commit();
            return $divisi;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete divisi
     */
    public function delete($id)
    {
        DB::beginTransaction();
        try {
            $divisi = $this->findId($id);
            $divisi->delete();
            DB::commit();
            return $divisi;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
