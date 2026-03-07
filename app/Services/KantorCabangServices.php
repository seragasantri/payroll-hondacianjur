<?php

namespace App\Services;

use App\Models\KantorCabang;
use Illuminate\Support\Facades\DB;

class KantorCabangServices
{
    protected $model;

    public function __construct()
    {
        $this->model = new KantorCabang();
    }

    /**
     * Get all kantor cabang
     */
    public function getAll()
    {
        return $this->model->newQuery();
    }

    /**
     * Find kantor cabang by ID
     */
    public function findId($id)
    {
        return $this->model->findOrFail($id);
    }

    /**
     * Create new kantor cabang
     */
    public function create(array $data)
    {
        DB::beginTransaction();
        try {
            $kantorCabang = $this->model->create([
                'name' => $data['name'],
            ]);
            DB::commit();
            return $kantorCabang;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update kantor cabang
     */
    public function update($id, array $data)
    {
        DB::beginTransaction();
        try {
            $kantorCabang = $this->findId($id);
            $kantorCabang->update([
                'name' => $data['name'] ?? $kantorCabang->name,
            ]);
            DB::commit();
            return $kantorCabang;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete kantor cabang
     */
    public function delete($id)
    {
        DB::beginTransaction();
        try {
            $kantorCabang = $this->findId($id);
            $kantorCabang->delete();
            DB::commit();
            return $kantorCabang;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
