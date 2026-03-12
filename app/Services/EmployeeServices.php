<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EmployeeServices
{
    protected $model;

    public function __construct()
    {
        $this->model = new Employee();
    }

    /**
     * Get all employees with optional filtering and sorting (excluding soft deleted)
     */
    public function getAll()
    {
        return $this->model->with(['user', 'kantorCabang', 'jabatan'])->newQuery();
    }

    /**
     * Get all soft deleted (retired) employees
     */
    public function getAllRetired()
    {
        return $this->model->with(['user' => function ($query) {
            $query->withTrashed();
        }, 'kantorCabang', 'jabatan'])->onlyTrashed()->newQuery();
    }

    /**
     * Find employee by ID
     */
    public function findId($id)
    {
        return $this->model->with(['user', 'kantorCabang', 'jabatan'])->findOrFail($id);
    }

    /**
     * Find soft deleted employee by ID
     */
    public function findIdTrashed($id)
    {
        return $this->model->with(['user' => function ($query) {
            $query->withTrashed();
        }, 'kantorCabang', 'jabatan'])->onlyTrashed()->findOrFail($id);
    }

    /**
     * Create new employee with user account
     */
    public function create(array $data)
    {
        DB::beginTransaction();
        try {
            // Use NIP as default password if not provided
            $password = !empty($data['password']) ? $data['password'] : $data['nip'];

            // Create user account first
            $user = User::create([
                'name' => $data['nama'],
                'username' => $data['nip'],
                'email' => $data['nip'] . '@employee.local', // Generate email from NIP
                'password' => Hash::make($password),
            ]);

            // Assign default role (optional)
            $user->assignRole('users');

            // Create employee linked to user
            $employeeData = [
                'user_id' => $user->id,
                'nip' => $data['nip'],
                'nama' => $data['nama'],
                'kantor_cabang_id' => $data['kantor_cabang_id'],
                'jabatan_id' => $data['jabatan_id'],
                'nomor_rekening' => $data['nomor_rekening'] ?? null,
                'status_pegawai' => $data['status_pegawai'] ?? null,
                'tanggal_mulai_kerja' => $data['tanggal_mulai_kerja'],
                'ptkp' => $data['ptkp'] ?? null,
                'gaji_pokok' => $data['gaji_pokok'],
                'tunjangan_jabatan' => $data['tunjangan_jabatan'],
                'potongan_tidak_masuk' => $data['potongan_tidak_masuk'],
                'potongan_terlambat' => $data['potongan_terlambat'],
            ];

            $employee = $this->model->create($employeeData);
            DB::commit();
            return $employee;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update employee and user account
     */
    public function update($id, array $data)
    {
        DB::beginTransaction();
        try {
            $employee = $this->findId($id);

            // Prepare employee data
            $employeeData = [
                'nip' => $data['nip'] ?? $employee->nip,
                'nama' => $data['nama'] ?? $employee->nama,
                'kantor_cabang_id' => $data['kantor_cabang_id'] ?? $employee->kantor_cabang_id,
                'jabatan_id' => $data['jabatan_id'] ?? $employee->jabatan_id,
                'nomor_rekening' => $data['nomor_rekening'] ?? $employee->nomor_rekening,
                'status_pegawai' => $data['status_pegawai'] ?? $employee->status_pegawai,
                'tanggal_mulai_kerja' => $data['tanggal_mulai_kerja'] ?? $employee->tanggal_mulai_kerja,
                'ptkp' => $data['ptkp'] ?? $employee->ptkp,
                'gaji_pokok' => $data['gaji_pokok'] ?? $employee->gaji_pokok,
                'tunjangan_jabatan' => $data['tunjangan_jabatan'] ?? $employee->tunjangan_jabatan,
                'potongan_tidak_masuk' => $data['potongan_tidak_masuk'] ?? $employee->potongan_tidak_masuk,
                'potongan_terlambat' => $data['potongan_terlambat'] ?? $employee->potongan_terlambat,
            ];

            // Update employee
            $employee->update($employeeData);

            // Update associated user
            if ($employee->user) {
                $userData = [
                    'name' => $employeeData['nama'],
                    'username' => $employeeData['nip'],
                ];

                // Update password if provided
                if (isset($data['password']) && !empty($data['password'])) {
                    $userData['password'] = Hash::make($data['password']);
                }

                $employee->user->update($userData);
            }

            DB::commit();
            return $employee;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete (retire) employee - soft deletes both employee and user
     */
    public function delete($id)
    {
        DB::beginTransaction();
        try {
            $employee = $this->findId($id);

            // Soft delete associated user first
            if ($employee->user) {
                $employee->user->delete();
            }

            // Soft delete employee
            $employee->delete();

            DB::commit();
            return $employee;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Restore retired employee and user
     */
    public function restore($id)
    {
        DB::beginTransaction();
        try {
            $employee = $this->findIdTrashed($id);

            // Restore associated user
            if ($employee->user) {
                $employee->user->restore();
            }

            // Restore employee
            $employee->restore();

            DB::commit();
            return $employee;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Permanently delete retired employee and user
     */
    public function forceDelete($id)
    {
        DB::beginTransaction();
        try {
            $employee = $this->findIdTrashed($id);

            // Permanently delete associated user
            if ($employee->user) {
                $employee->user->forceDelete();
            }

            // Permanently delete employee
            $employee->forceDelete();

            DB::commit();
            return $employee;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
