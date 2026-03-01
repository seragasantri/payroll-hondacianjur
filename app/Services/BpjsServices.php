<?php

namespace App\Services;

use App\Models\Bpjs;
use Illuminate\Support\Facades\DB;

class BpjsServices
{
    protected $model;

    public function __construct()
    {
        $this->model = new Bpjs();
    }

    /**
     * Get all bpjs with optional filtering and sorting
     */
    public function getAll()
    {
        return $this->model->newQuery();
    }

    /**
     * Find bpjs by ID
     */
    public function findId($id)
    {
        return $this->model->findOrFail($id);
    }

    /**
     * Create new bpjs
     */
    public function create(array $data)
    {
        DB::beginTransaction();
        try {
            $bpjs = $this->model->create($data);
            DB::commit();
            return $bpjs;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update bpjs
     */
    public function update($id, array $data)
    {
        DB::beginTransaction();
        try {
            $bpjs = $this->findId($id);
            $bpjs->update($data);
            DB::commit();
            return $bpjs;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete bpjs
     */
    public function delete($id)
    {
        DB::beginTransaction();
        try {
            $bpjs = $this->findId($id);
            $bpjs->delete();
            DB::commit();
            return $bpjs;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
