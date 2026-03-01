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
     * Get all employees with optional filtering and sorting
     */
    public function getAll()
    {
        return $this->model->with('user')->newQuery();
    }

    /**
     * Find employee by ID
     */
    public function findId($id)
    {
        return $this->model->with('user')->findOrFail($id);
    }

    /**
     * Create new employee with user account
     */
    public function create(array $data)
    {
        DB::beginTransaction();
        try {
            // Create user account first
            $user = User::create([
                'name' => $data['nama'],
                'username' => $data['nip'],
                'email' => $data['nip'] . '@employee.local', // Generate email from NIP
                'password' => Hash::make($data['password']),
            ]);

            // Assign default role (optional)
            $user->assignRole('users');

            // Create employee linked to user
            $employeeData = [
                'user_id' => $user->id,
                'nip' => $data['nip'],
                'nama' => $data['nama'],
                'divisi' => $data['divisi'],
                'jabatan' => $data['jabatan'],
                'tanggal_mulai_kerja' => $data['tanggal_mulai_kerja'],
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
                'divisi' => $data['divisi'] ?? $employee->divisi,
                'jabatan' => $data['jabatan'] ?? $employee->jabatan,
                'tanggal_mulai_kerja' => $data['tanggal_mulai_kerja'] ?? $employee->tanggal_mulai_kerja,
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
     * Delete employee
     */
    public function delete($id)
    {
        DB::beginTransaction();
        try {
            $employee = $this->findId($id);
            $employee->delete();
            DB::commit();
            return $employee;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
