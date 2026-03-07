<?php

namespace App\Services;

use App\Models\Payrolls;
use App\Models\PayrollDetail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PayrollServices
{
    protected $payrollsModel;
    protected $payrollDetailModel;

    public function __construct()
    {
        $this->payrollsModel = new Payrolls();
        $this->payrollDetailModel = new PayrollDetail();
    }

    public function getAll(): Builder
    {
        return $this->payrollsModel->with(['details', 'details.employee', 'details.employee.kantorCabang', 'details.employee.jabatan'])->newQuery();
    }

    public function findId(int $id): Model
    {
        return $this->payrollsModel->with(['details', 'details.employee', 'details.employee.kantorCabang', 'details.employee.jabatan'])->findOrFail($id);
    }

    public function create(array $data): Payrolls
    {
        return $this->payrollsModel->create($data);
    }

    public function update(int $id, array $data): Payrolls
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

    public function getByEmployeeAndMonth(int $employeeId, string $bulan): ?PayrollDetail
    {
        return $this->payrollDetailModel->whereHas('payroll', function ($query) use ($bulan) {
            $query->where('bulan', $bulan);
        })->where('employee_id', $employeeId)->first();
    }

    public function generatePayroll(string $bulan, ?string $status = null): int
    {
        // Create payroll header
        $payrollHeader = Payrolls::updateOrCreate(
            [
                'bulan' => $bulan,
                'status_pegawai' => $status,
            ],
            [
                'status' => 'draft',
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]
        );

        $employees = \App\Models\Employee::with(['kantorCabang', 'jabatan'])
            ->where('status_pegawai', $status)
            ->get();
        $count = 0;

        foreach ($employees as $employee) {
            $existing = PayrollDetail::where('payroll_id', $payrollHeader->id)
                ->where('employee_id', $employee->id)
                ->first();

            if (!$existing) {
                PayrollDetail::create([
                    'payroll_id' => $payrollHeader->id,
                    'employee_id' => $employee->id,
                    'gaji_pokok' => $employee->gaji_pokok,
                    'tunjangan_jabatan' => $employee->tunjangan_jabatan,
                    'hari_kerja' => 0,
                    'hari_masuk' => 0,
                    'jam_terlambat' => 0,
                    'tunjangan_lain' => '[]',
                    'potongan_tidak_masuk' => 0,
                    'potongan_terlambat' => 0,
                    'potongan_lain' => 0,
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
                ]);
                $count++;
            }
        }

        return $count;
    }

    public function publishPayroll(string $bulan): int
    {
        return Payrolls::where('bulan', $bulan)->update([
            'status' => 'published',
            'tanggal_pembayaran' => now(),
            'updated_by' => auth()->id(),
        ]);
    }
}
