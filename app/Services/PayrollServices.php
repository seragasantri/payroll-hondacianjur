<?php

namespace App\Services;

use App\Models\Payroll;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PayrollServices
{
    protected $model;

    public function __construct()
    {
        $this->model = new Payroll();
    }

    public function getAll(): Builder
    {
        return $this->model->with(['employee', 'employee.divisi', 'employee.jabatan'])->newQuery();
    }

    public function findId(int $id): Model
    {
        return $this->model->with(['employee', 'employee.divisi', 'employee.jabatan'])->findOrFail($id);
    }

    public function create(array $data): Payroll
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): Payroll
    {
        $payroll = $this->findId($id);
        $payroll->update($data);
        return $payroll->fresh();
    }

    public function delete(int $id): void
    {
        $payroll = $this->findId($id);
        $payroll->delete();
    }

    public function getByEmployeeAndMonth(int $employeeId, string $bulan): ?Payroll
    {
        return $this->model->where('employee_id', $employeeId)
            ->where('bulan', $bulan)
            ->first();
    }

    public function generatePayroll(string $bulan): int
    {
        $employees = \App\Models\Employee::with(['divisi', 'jabatan'])->get();
        $count = 0;

        foreach ($employees as $employee) {
            $existing = $this->getByEmployeeAndMonth($employee->id, $bulan);

            if (!$existing) {
                $this->model->create([
                    'employee_id' => $employee->id,
                    'bulan' => $bulan,
                    'gaji_pokok' => $employee->gaji_pokok,
                    'tunjangan_jabatan' => $employee->tunjangan_jabatan,
                    'hari_kerja' => 0,
                    'hari_masuk' => 0,
                    'jam_terlambat' => 0,
                    'tunjangan_lain' => 0,
                    'potongan_tidak_masuk' => 0,
                    'potongan_terlambat' => 0,
                    'potongan_lain' => 0,
                    'status' => 'draft',
                ]);
                $count++;
            }
        }

        return $count;
    }

    public function publishPayroll(string $bulan): int
    {
        return $this->model->where('bulan', $bulan)->update([
            'status' => 'published',
            'tanggal_pembayaran' => now(),
        ]);
    }
}
