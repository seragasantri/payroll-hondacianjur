<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\KantorCabang;
use App\Models\Payrolls;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Check if user has karyawan role
        $isKaryawan = $user->hasRole('users');

        if ($isKaryawan) {
            // Get employee data associated with this user
            $employee = Employee::with(['kantorCabang', 'jabatan'])
                ->where('user_id', $user->id)
                ->first();

            // If no employee record, show message
            if (!$employee) {
                return Inertia::render('dashboard', [
                    'userRole' => 'users',
                    'employee' => null,
                    'message' => 'Data karyawan tidak ditemukan. Hubungi administrator.',
                ]);
            }

            // Get employee's published payrolls
            $payrolls = Payrolls::where('status', 'published')
                ->whereHas('details', function ($query) use ($employee) {
                    $query->where('employee_id', $employee->id);
                })
                ->with(['details' => function ($query) use ($employee) {
                    $query->where('employee_id', $employee->id);
                }])
                ->orderBy('bulan', 'desc')
                ->get();

            return Inertia::render('dashboard', [
                'userRole' => 'karyawan',
                'employee' => [
                    'nama' => $employee->nama,
                    'nip' => $employee->nip,
                    'jabatan' => $employee->jabatan?->name,
                    'kantor_cabang' => $employee->kantorCabang?->name,
                    'tanggal_mulai_kerja' => $employee->tanggal_mulai_kerja,
                    'status_pegawai' => $employee->status_pegawai,
                    'ptkp' => $employee->ptkp,
                    'nomor_rekening' => $employee->nomor_rekening,
                ],
                'payrolls' => $payrolls->map(function ($payroll) {
                    $detail = $payroll->details->first();
                    return [
                        'bulan' => $payroll->bulan,
                        'status' => $payroll->status,
                        'total_gaji' => $detail?->total_gaji ?? 0,
                        'total_potongan' => $detail?->total_potongan ?? 0,
                        'gaji_bersih' => $detail?->gaji_bersih ?? 0,
                    ];
                }),
            ]);
        }

        // Admin dashboard
        // Get all kantor cabang with employee count
        $kantorCabangs = KantorCabang::withCount('employees')->get();

        // Get payroll summary
        $payrollSummary = Payrolls::where('status', 'published')
            ->withCount('details')
            ->get()
            ->map(function ($payroll) {
                return [
                    'bulan' => $payroll->bulan,
                    'status_pegawai' => $payroll->status_pegawai,
                    'details_count' => $payroll->details_count,
                ];
            });

        // Total employees
        $totalEmployees = Employee::count();

        // Total kantor cabang
        $totalKantorCabang = KantorCabang::count();

        // Total published payrolls
        $totalPayrolls = Payrolls::where('status', 'published')->count();

        return Inertia::render('dashboard', [
            'userRole' => 'admin',
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'totalKantorCabang' => $totalKantorCabang,
                'totalPayrolls' => $totalPayrolls,
            ],
            'kantorCabangs' => $kantorCabangs->map(function ($kc) {
                return [
                    'id' => $kc->id,
                    'name' => $kc->name,
                    'employees_count' => $kc->employees_count,
                ];
            }),
            'payrollSummary' => $payrollSummary,
        ]);
    }
}
