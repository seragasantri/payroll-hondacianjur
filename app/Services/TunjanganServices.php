<?php

namespace App\Services;

use App\Models\Tunjangan;
use Illuminate\Support\Facades\DB;

class TunjanganServices
{
    protected $model;

    public function __construct()
    {
        $this->model = new Tunjangan();
    }

    /**
     * Get all tunjangan with optional filtering and sorting
     */
    public function getAll()
    {
        return $this->model->newQuery();
    }

    /**
     * Find tunjangan by ID
     */
    public function findId($id)
    {
        return $this->model->findOrFail($id);
    }

    /**
     * Create new tunjangan
     */
    public function create(array $data)
    {
        DB::beginTransaction();
        try {
            $tunjangan = $this->model->create($data);
            DB::commit();
            return $tunjangan;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update tunjangan
     */
    public function update($id, array $data)
    {
        DB::beginTransaction();
        try {
            $tunjangan = $this->findId($id);
            $tunjangan->update($data);
            DB::commit();
            return $tunjangan;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete tunjangan
     */
    public function delete($id)
    {
        DB::beginTransaction();
        try {
            $tunjangan = $this->findId($id);
            $tunjangan->delete();
            DB::commit();
            return $tunjangan;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
