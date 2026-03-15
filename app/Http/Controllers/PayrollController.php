<?php

namespace App\Http\Controllers;

use App\Http\Requests\PayrollStoreRequest;
use App\Http\Requests\PayrollUpdateRequest;
use App\Http\Resources\PayrollResource;
use App\Models\Employee;
use App\Models\Payrolls;
use App\Models\PayrollDetail;
use App\Models\Tunjangan;
use App\Services\PayrollServices;
use App\Services\TaxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PayrollController extends Controller
{
    protected $payrollServices;

    public function __construct()
    {
        $this->payrollServices = new PayrollServices();
        $this->taxService = new TaxService();
    }

    /**
     * Display a listing of the resource (payrolls header).
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Manual authorization check
        $roleNames = $user->getRoleNames()->toArray();
        $hasAccess = $user->hasPermissionTo('payroll.view any')
            || in_array('Super Admin', $roleNames)
            || in_array('users', $roleNames);

        if (!$hasAccess) {
            abort(403, 'Unauthorized');
        }

        $isUsersRole = in_array('users', $roleNames);

        // If user has 'users' role, only show their own payroll data
        if ($isUsersRole) {
            // Get employee data associated with this user (include soft-deleted for historical data)
            $employee = Employee::withTrashed()->where('user_id', $user->id)->first();

            if (!$employee) {
                return Inertia::render('payroll/index', [
                    'payrollSummary' => [
                        'data' => [],
                        'links' => [],
                        'meta' => []
                    ]
                ]);
            }

            // Get published payrolls that contain this employee's data
            $payrollSummary = Payrolls::select('id', 'bulan', 'status_pegawai', 'status')
                ->where('status', 'published')
                ->whereHas('details', function ($query) use ($employee) {
                    $query->where('employee_id', $employee->id);
                })
                ->withCount('details')
                ->orderBy('bulan', 'desc')
                ->orderBy('status_pegawai', 'asc')
                ->paginate(12);

            return Inertia::render('payroll/index', [
                'payrollSummary' => $payrollSummary,
                'isKaryawan' => true
            ]);
        }

        // Admin/Super Admin sees all payrolls
        $payrollSummary = Payrolls::select('id', 'bulan', 'status_pegawai', 'status')
            ->withCount('details')
            ->orderBy('bulan', 'desc')
            ->orderBy('status_pegawai', 'asc')
            ->paginate(12);

        return Inertia::render('payroll/index', [
            'payrollSummary' => $payrollSummary,
            'isKaryawan' => false
        ]);
    }

    /**
     * Show payroll for a specific the form for creating month.
     */
    public function create(Request $request)
    {
        Gate::authorize('create', Payrolls::class);

        $bulan = $request->get('bulan', date('Y-m'));
        $status = $request->get('status');

        // Status is required
        if (!$status) {
            return redirect()->route('payroll.index')
                ->with('error', 'Status Pegawai wajib dipilih!');
        }

        // Check if this is THR (format: "THR YYYY")
        $isThr = str_starts_with($status, 'THR');

        // Check if payrolls header exists
        $payrollHeader = Payrolls::where('bulan', $bulan)
            ->when(!$isThr, function ($query) use ($status) {
                $query->where('status_pegawai', $status);
            })
            ->first();

        $payrollDetails = collect([]);
        if ($payrollHeader) {
            $payrollDetails = PayrollDetail::where('payroll_id', $payrollHeader->id)
                ->with(['employee' => function ($query) {
                    $query->withTrashed();
                }, 'employee.kantorCabang', 'employee.jabatan'])
                ->get()
                ->keyBy('employee_id');
        }

        // Get active employees
        $employees = \App\Models\Employee::with(['kantorCabang', 'jabatan'])
            ->whereNull('deleted_at')
            ->when(!$isThr, function ($query) use ($status) {
                $query->where('status_pegawai', $status);
            })
            ->orderBy('nama', 'asc')
            ->get();

        // If there's existing payroll (and not THR), also include soft-deleted employees that have payroll data
        if ($payrollHeader && !$isThr) {
            $existingEmployeeIds = $payrollDetails->pluck('employee_id')->toArray();
            $softDeletedEmployees = \App\Models\Employee::with(['kantorCabang', 'jabatan'])
                ->withTrashed()
                ->whereIn('id', $existingEmployeeIds)
                ->whereNotNull('deleted_at')
                ->orderBy('nama', 'asc')
                ->get();

            // Merge active employees with soft-deleted employees that have existing payroll
            $employees = $employees->merge($softDeletedEmployees);
        }

        $tunjanganList = \App\Models\Tunjangan::orderBy('id', 'asc')->get();

        $employeesWithPayroll = $employees->map(function ($employee) use ($payrollDetails, $bulan, $tunjanganList) {
            $existing = $payrollDetails->get($employee->id);

            // Parse existing tunjangan data
            $existingTunjangan = [];
            if ($existing && $existing->tunjangan_lain) {
                $existingTunjangan = json_decode($existing->tunjangan_lain, true) ?? [];
            }

            // Use existing payroll values if available, otherwise use employee defaults
            $gajiPokok = $existing ? (float) $existing->gaji_pokok : (float) $employee->gaji_pokok;
            $tunjanganJabatan = $existing ? (float) $existing->tunjangan_jabatan : (float) $employee->tunjangan_jabatan;

            return [
                'id' => $employee->id,
                'nip' => $employee->nip,
                'nama' => $employee->nama,
                'tanggal_mulai_kerja' => $employee->tanggal_mulai_kerja,
                'kantorCabang' => $employee->kantorCabang?->name,
                'jabatan' => $employee->jabatan?->name,
                'ptkp' => $employee->ptkp ?? 'TK/0',
                'gaji_pokok' => $gajiPokok,
                'tunjangan_jabatan' => $tunjanganJabatan,
                'potongan_tidak_masuk' => (float) $employee->potongan_tidak_masuk,
                'potongan_terlambat' => (float) $employee->potongan_terlambat,
                'tunjangan' => $tunjanganList->map(function ($tunjangan) use ($existingTunjangan, $employee) {
                    $tunjanganId = (string) $tunjangan->id;

                    // Check if existing value in payroll
                    if (isset($existingTunjangan[$tunjanganId])) {
                        $nilaiPerusahaan = $existingTunjangan[$tunjanganId]['perusahaan'] ?? 0;
                        $nilaiKaryawan = $existingTunjangan[$tunjanganId]['karyawan'] ?? 0;
                    } else {
                        // Calculate from percentage
                        $nilaiPerusahaan = $tunjangan->perusahaan > 0
                            ? round($tunjangan->perusahaan / 100 * $employee->gaji_pokok)
                            : 0;
                        $nilaiKaryawan = $tunjangan->karyawan > 0
                            ? round($tunjangan->karyawan / 100 * $employee->gaji_pokok)
                            : 0;
                    }

                    return [
                        'id' => $tunjangan->id,
                        'jenis' => $tunjangan->jenis_tunjangan,
                        'perusahaan' => (float) $nilaiPerusahaan,
                        'karyawan' => (float) $nilaiKaryawan
                    ];
                }),
                'payroll' => $existing ? [
                    'id' => $existing->id,
                    'hari_kerja' => (int) $existing->hari_kerja,
                    'hari_masuk' => (int) $existing->hari_masuk,
                    'jam_terlambat' => (int) $existing->jam_terlambat,
                    'insentif' => (float) $existing->insentif,
                    'uang_hadir' => (float) $existing->uang_hadir,
                    'lembur' => (float) $existing->lembur,
                    'reward' => (float) $existing->reward,
                    'lain_lain' => (float) $existing->lain_lain,
                    'kasbon' => (float) $existing->kasbon,
                    'tunjangan_lain' => $existing->tunjangan_lain,
                    'potongan_tidak_masuk' => (float) $existing->potongan_tidak_masuk,
                    'potongan_terlambat' => (float) $existing->potongan_terlambat,
                    'potongan_lain' => (float) $existing->potongan_lain,
                    'total_gaji' => (float) $existing->total_gaji,
                    'total_potongan' => (float) $existing->total_potongan,
                    'gaji_bersih' => (float) $existing->gaji_bersih,
                    'pph21_amount' => (float) $existing->pph21_amount,
                    'tax_method' => $existing->tax_method,
                    'tax_rate_applied' => (float) $existing->tax_rate_applied,
                ] : null
            ];
        });

        return Inertia::render('payroll/create', [
            'bulan' => $bulan,
            'status' => $status,
            'payrollId' => $payrollHeader?->id,
            'employees' => $employeesWithPayroll,
            'tunjanganList' => $tunjanganList
        ]);
    }

    /**
     * Store payroll for a specific month (batch).
     */
    public function store(Request $request)
    {
        Gate::authorize('create', Payrolls::class);

        $bulan = $request->get('bulan');
        $status = $request->get('status');
        $publish = $request->boolean('publish', false);

        if (!$bulan) {
            return response()->json(['error' => 'Bulan is required'], 400);
        }

        // Create or update payrolls header
        $payrollHeader = Payrolls::updateOrCreate(
            [
                'bulan' => $bulan,
                'status_pegawai' => $status,
            ],
            [
                'status' => $publish ? 'published' : 'draft',
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]
        );

        $payrollData = $request->input('payroll', []);

        foreach ($payrollData as $employeeId => $data) {
            $employee = \App\Models\Employee::find($employeeId);
            if (!$employee) continue;

            $hariMasuk = (int) ($data['hari_masuk'] ?? 0);
            $hariKerja = (int) ($data['hari_kerja'] ?? 22);
            $hariTidakMasuk = max(0, $hariKerja - $hariMasuk);
            $potonganTidakMasuk = (float) ($hariTidakMasuk * ($employee->potongan_tidak_masuk ?? 0));

            $jamTerlambat = (int) ($data['jam_terlambat'] ?? 0);
            $potonganTerlambat = (float) ($jamTerlambat * ($employee->potongan_terlambat ?? 0));

            // Ensure numeric values
            $insentif = is_numeric($data['insentif'] ?? null) ? (float) $data['insentif'] : 0;
            $potonganLain = is_numeric($data['potongan_lain'] ?? null) ? (float) $data['potongan_lain'] : 0;

            // Get editable values (use from request, fallback to employee default)
            $gajiPokok = isset($data['gaji_pokok']) && is_numeric($data['gaji_pokok'])
                ? (float) $data['gaji_pokok']
                : (float) $employee->gaji_pokok;
            $tunjanganJabatan = isset($data['tunjangan_jabatan']) && is_numeric($data['tunjangan_jabatan'])
                ? (float) $data['tunjangan_jabatan']
                : (float) $employee->tunjangan_jabatan;

            // Get new fields values
            $uangHadir = isset($data['uang_hadir']) && is_numeric($data['uang_hadir'])
                ? (float) $data['uang_hadir']
                : 0;
            $lembur = isset($data['lembur']) && is_numeric($data['lembur'])
                ? (float) $data['lembur']
                : 0;
            $reward = isset($data['reward']) && is_numeric($data['reward'])
                ? (float) $data['reward']
                : 0;
            $lainLain = isset($data['lain_lain']) && is_numeric($data['lain_lain'])
                ? (float) $data['lain_lain']
                : 0;
            $kasbon = isset($data['kasbon']) && is_numeric($data['kasbon'])
                ? (float) $data['kasbon']
                : 0;

            // Calculate total tunjangan perusahaan and karyawan
            $tunjanganLainInput = $data['tunjangan'] ?? [];
            $totalTunjanganPerusahaan = 0;
            $totalPotonganKaryawan = 0;

            // Convert array to object with string keys for proper storage
            $tunjanganLain = [];
            foreach ($tunjanganLainInput as $t) {
                $tunjanganId = (string) ($t['id'] ?? 0);
                $tunjanganLain[$tunjanganId] = [
                    'perusahaan' => (float) ($t['perusahaan'] ?? 0),
                    'karyawan' => (float) ($t['karyawan'] ?? 0),
                ];
                $totalTunjanganPerusahaan += (float) ($t['perusahaan'] ?? 0);
                $totalPotonganKaryawan += (float) ($t['karyawan'] ?? 0);
            }

            // Calculate gross salary for tax
            $grossSalary = $gajiPokok + $tunjanganJabatan + $insentif + $uangHadir + $lembur + $reward + $lainLain + $totalTunjanganPerusahaan;

            // Calculate PPh21 tax based on employee's PTKP
            $ptkpCode = $employee->ptkp ?? 'TK/0';
            $taxResult = $this->taxService->hitungPPh21($grossSalary, $ptkpCode);

            $pph21Amount = $taxResult['pph21_bulanan'];
            $taxMethod = $taxResult['method'];
            $taxRateApplied = $taxResult['tarif'];

            // Check if payroll detail exists
            $existing = PayrollDetail::where('payroll_id', $payrollHeader->id)
                ->where('employee_id', $employeeId)
                ->first();

            if ($existing) {
                $existing->update([
                    'hari_kerja' => $hariKerja,
                    'hari_masuk' => $hariMasuk,
                    'jam_terlambat' => $jamTerlambat,
                    'gaji_pokok' => $gajiPokok,
                    'tunjangan_jabatan' => $tunjanganJabatan,
                    'insentif' => $insentif,
                    'uang_hadir' => $uangHadir,
                    'lembur' => $lembur,
                    'reward' => $reward,
                    'lain_lain' => $lainLain,
                    'kasbon' => $kasbon,
                    'tunjangan_lain' => json_encode($tunjanganLain),
                    'potongan_tidak_masuk' => $potonganTidakMasuk,
                    'potongan_terlambat' => $potonganTerlambat,
                    'potongan_lain' => $potonganLain,
                    'pph21_amount' => $pph21Amount,
                    'tax_method' => $taxMethod,
                    'tax_rate_applied' => $taxRateApplied,
                    'updated_by' => auth()->id(),
                ]);
            } else {
                PayrollDetail::create([
                    'payroll_id' => $payrollHeader->id,
                    'employee_id' => $employeeId,
                    'hari_kerja' => $hariKerja,
                    'hari_masuk' => $hariMasuk,
                    'jam_terlambat' => $jamTerlambat,
                    'gaji_pokok' => $gajiPokok,
                    'tunjangan_jabatan' => $tunjanganJabatan,
                    'insentif' => $insentif,
                    'uang_hadir' => $uangHadir,
                    'lembur' => $lembur,
                    'reward' => $reward,
                    'lain_lain' => $lainLain,
                    'kasbon' => $kasbon,
                    'tunjangan_lain' => json_encode($tunjanganLain),
                    'potongan_tidak_masuk' => $potonganTidakMasuk,
                    'potongan_terlambat' => $potonganTerlambat,
                    'potongan_lain' => $potonganLain,
                    'pph21_amount' => $pph21Amount,
                    'tax_method' => $taxMethod,
                    'tax_rate_applied' => $taxRateApplied,
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
                ]);
            }
        }

        $message = $publish
            ? 'Payroll bulan ' . $bulan . ' berhasil dipublish!'
            : 'Payroll bulan ' . $bulan . ' berhasil disimpan!';

        return redirect()->route('payroll.index')
            ->with('success', $message);
    }

    /**
     * Show payroll detail for a specific month (view only).
     */
    public function show($bulan, Request $request)
    {
        $user = Auth::user();
        $isUsersRole = $user->hasRole('users');

        // For users role, check if they have permission
        if ($isUsersRole) {
            $roleNames = $user->getRoleNames()->toArray();
            if (!in_array('users', $roleNames) && !in_array('Super Admin', $roleNames)) {
                abort(403, 'Unauthorized');
            }
        } else {
            Gate::authorize('viewAny', Payrolls::class);
        }

        $status = $request->get('status');

        // Get payrolls header
        $payrollHeader = Payrolls::where('bulan', $bulan)
            ->when($status && !str_starts_with($status, 'THR'), function ($query) use ($status) {
                $query->where('status_pegawai', $status);
            })
            ->first();

        if (!$payrollHeader) {
            return redirect()->route('payroll.index')
                ->with('error', 'Payroll tidak ditemukan!');
        }

        // For users role, only show their own data
        if ($isUsersRole) {
            $employee = Employee::withTrashed()->where('user_id', $user->id)->first();
            if (!$employee) {
                return redirect()->route('payroll.index')
                    ->with('error', 'Data karyawan tidak ditemukan!');
            }

            // Get only this employee's payroll detail (include soft-deleted employee)
            $payrollDetail = PayrollDetail::where('payroll_id', $payrollHeader->id)
                ->where('employee_id', $employee->id)
                ->with(['employee' => function ($query) {
                    $query->withTrashed();
                }, 'employee.kantorCabang', 'employee.jabatan'])
                ->first();

            $tunjanganList = \App\Models\Tunjangan::orderBy('id', 'asc')->get();

            $existingTunjangan = [];
            if ($payrollDetail && $payrollDetail->tunjangan_lain) {
                $existingTunjangan = json_decode($payrollDetail->tunjangan_lain, true) ?? [];
            }

            $employeeData = $employee->toArray();
            $employeeData['kantorCabang'] = $employee->kantorCabang?->name;
            $employeeData['jabatan'] = $employee->jabatan?->name;
            $employeeData['payroll'] = $payrollDetail ? [
                'id' => $payrollDetail->id,
                'hari_kerja' => (int) $payrollDetail->hari_kerja,
                'hari_masuk' => (int) $payrollDetail->hari_masuk,
                'jam_terlambat' => (int) $payrollDetail->jam_terlambat,
                'insentif' => (float) $payrollDetail->insentif,
                'uang_hadir' => (float) $payrollDetail->uang_hadir,
                'lembur' => (float) $payrollDetail->lembur,
                'reward' => (float) $payrollDetail->reward,
                'lain_lain' => (float) $payrollDetail->lain_lain,
                'kasbon' => (float) $payrollDetail->kasbon,
                'tunjangan_lain' => $payrollDetail->tunjangan_lain,
                'potongan_tidak_masuk' => (float) $payrollDetail->potongan_tidak_masuk,
                'potongan_terlambat' => (float) $payrollDetail->potongan_terlambat,
                'potongan_lain' => (float) $payrollDetail->potongan_lain,
                'total_gaji' => (float) $payrollDetail->total_gaji,
                'total_potongan' => (float) $payrollDetail->total_potongan,
                'gaji_bersih' => (float) $payrollDetail->gaji_bersih,
                'status' => $payrollHeader->status,
                'pph21_amount' => (float) $payrollDetail->pph21_amount,
                'tax_method' => $payrollDetail->tax_method,
                'tax_rate_applied' => (float) $payrollDetail->tax_rate_applied,
            ] : null;
            $employeeData['tunjangan'] = $tunjanganList->map(function ($tunjangan) use ($existingTunjangan, $employee) {
                $tunjanganId = (string) $tunjangan->id;
                if (isset($existingTunjangan[$tunjanganId])) {
                    $nilaiPerusahaan = $existingTunjangan[$tunjanganId]['perusahaan'] ?? 0;
                    $nilaiKaryawan = $existingTunjangan[$tunjanganId]['karyawan'] ?? 0;
                } else {
                    $nilaiPerusahaan = $tunjangan->perusahaan > 0
                        ? round($tunjangan->perusahaan / 100 * $employee->gaji_pokok)
                        : 0;
                    $nilaiKaryawan = $tunjangan->karyawan > 0
                        ? round($tunjangan->karyawan / 100 * $employee->gaji_pokok)
                        : 0;
                }
                return [
                    'id' => $tunjangan->id,
                    'jenis' => $tunjangan->jenis_tunjangan,
                    'perusahaan' => (float) $nilaiPerusahaan,
                    'karyawan' => (float) $nilaiKaryawan,
                ];
            });

            return Inertia::render('payroll/detail', [
                'bulan' => $payrollHeader->bulan,
                'status_pegawai' => $payrollHeader->status_pegawai,
                'status' => $payrollHeader->status,
                'employees' => [$employeeData],
            ]);
        }

        // Get payroll details - include soft-deleted employees for historical data
        $payrollDetails = PayrollDetail::where('payroll_id', $payrollHeader->id)
            ->with(['employee' => function ($query) {
                $query->withTrashed();
            }, 'employee.kantorCabang', 'employee.jabatan'])
            ->get()
            ->keyBy('employee_id');

        // Get employees from payroll details (includes soft-deleted)
        $employeeIds = $payrollDetails->pluck('employee_id')->toArray();
        $employees = \App\Models\Employee::with(['kantorCabang', 'jabatan'])
            ->withTrashed()
            ->whereIn('id', $employeeIds)
            ->orderBy('nama', 'asc')
            ->get();

        $tunjanganList = \App\Models\Tunjangan::orderBy('id', 'asc')->get();

        $employeesWithPayroll = $employees->map(function ($employee) use ($payrollDetails, $bulan, $tunjanganList, $payrollHeader) {
            $existing = $payrollDetails->get($employee->id);

            $existingTunjangan = [];
            if ($existing && $existing->tunjangan_lain) {
                $existingTunjangan = json_decode($existing->tunjangan_lain, true) ?? [];
            }

            // Use existing payroll values if available, otherwise use employee defaults
            $gajiPokok = $existing ? (float) $existing->gaji_pokok : (float) $employee->gaji_pokok;
            $tunjanganJabatan = $existing ? (float) $existing->tunjangan_jabatan : (float) $employee->tunjangan_jabatan;

            return [
                'id' => $employee->id,
                'nip' => $employee->nip,
                'nama' => $employee->nama,
                'tanggal_mulai_kerja' => $employee->tanggal_mulai_kerja,
                'kantorCabang' => $employee->kantorCabang?->name,
                'jabatan' => $employee->jabatan?->name,
                'gaji_pokok' => $gajiPokok,
                'tunjangan_jabatan' => $tunjanganJabatan,
                'potongan_tidak_masuk' => (float) $employee->potongan_tidak_masuk,
                'potongan_terlambat' => (float) $employee->potongan_terlambat,
                'tunjangan' => $tunjanganList->map(function ($tunjangan) use ($existingTunjangan, $employee) {
                    $tunjanganId = (string) $tunjangan->id;

                    if (isset($existingTunjangan[$tunjanganId])) {
                        $nilaiPerusahaan = $existingTunjangan[$tunjanganId]['perusahaan'] ?? 0;
                        $nilaiKaryawan = $existingTunjangan[$tunjanganId]['karyawan'] ?? 0;
                    } else {
                        $nilaiPerusahaan = $tunjangan->perusahaan > 0
                            ? round($tunjangan->perusahaan / 100 * $employee->gaji_pokok)
                            : 0;
                        $nilaiKaryawan = $tunjangan->karyawan > 0
                            ? round($tunjangan->karyawan / 100 * $employee->gaji_pokok)
                            : 0;
                    }

                    return [
                        'id' => $tunjangan->id,
                        'jenis' => $tunjangan->jenis_tunjangan,
                        'perusahaan' => (float) $nilaiPerusahaan,
                        'karyawan' => (float) $nilaiKaryawan
                    ];
                }),
                'payroll' => $existing ? [
                    'id' => $existing->id,
                    'hari_kerja' => (int) $existing->hari_kerja,
                    'hari_masuk' => (int) $existing->hari_masuk,
                    'jam_terlambat' => (int) $existing->jam_terlambat,
                    'insentif' => (float) $existing->insentif,
                    'uang_hadir' => (float) $existing->uang_hadir,
                    'lembur' => (float) $existing->lembur,
                    'reward' => (float) $existing->reward,
                    'lain_lain' => (float) $existing->lain_lain,
                    'kasbon' => (float) $existing->kasbon,
                    'tunjangan_lain' => $existing->tunjangan_lain,
                    'potongan_tidak_masuk' => (float) $existing->potongan_tidak_masuk,
                    'potongan_terlambat' => (float) $existing->potongan_terlambat,
                    'potongan_lain' => (float) $existing->potongan_lain,
                    'total_gaji' => (float) $existing->total_gaji,
                    'total_potongan' => (float) $existing->total_potongan,
                    'gaji_bersih' => (float) $existing->gaji_bersih,
                    'status' => $payrollHeader->status,
                    'pph21_amount' => (float) $existing->pph21_amount,
                    'tax_method' => $existing->tax_method,
                    'tax_rate_applied' => (float) $existing->tax_rate_applied,
                ] : null
            ];
        });

        return Inertia::render('payroll/detail', [
            'bulan' => $bulan,
            'status_pegawai' => $payrollHeader->status_pegawai,
            'status' => $payrollHeader->status,
            'employees' => $employeesWithPayroll,
            'tunjanganList' => $tunjanganList
        ]);
    }

    /**
     * Export payroll to Excel.
     */
    public function export($bulan, Request $request)
    {
        $user = Auth::user();
        $isUsersRole = $user->hasRole('users');

        // Manual authorization check
        $roleNames = $user->getRoleNames()->toArray();
        $hasAccess = $user->hasPermissionTo('payroll.view any')
            || in_array('Super Admin', $roleNames)
            || in_array('users', $roleNames);

        if (!$hasAccess) {
            abort(403, 'Unauthorized');
        }

        $status = $request->get('status');

        // Get payrolls header
        $payrollHeader = Payrolls::where('bulan', $bulan)
            ->when($status, function ($query) use ($status) {
                $query->where('status_pegawai', $status);
            })
            ->first();

        if (!$payrollHeader || $payrollHeader->status !== 'published') {
            return redirect()->route('payroll.index')
                ->with('error', 'Payroll belum dipublish!');
        }

        // Get payroll details (include soft-deleted employees)
        $payrollDetailsQuery = PayrollDetail::where('payroll_id', $payrollHeader->id)
            ->with(['employee' => function ($query) {
                $query->withTrashed();
            }, 'employee.kantorCabang', 'employee.jabatan']);

        // If user has 'users' role, only export their own data
        if ($isUsersRole) {
            $employee = Employee::withTrashed()->where('user_id', $user->id)->first();
            if (!$employee) {
                return redirect()->route('payroll.index')
                    ->with('error', 'Data karyawan tidak ditemukan!');
            }
            $payrollDetailsQuery->where('employee_id', $employee->id);
        }

        $payrollDetails = $payrollDetailsQuery->get();

        // Parse bulan to get date parts and Indonesian month name
        $bulanDate = \Carbon\Carbon::parse($bulan . '-01');
        $day = $bulanDate->format('d');
        $month = $bulanDate->format('m');
        $year = $bulanDate->format('y');

        $bulanIndo = [
            '01' => 'JANUARI',
            '02' => 'FEBRUARI',
            '03' => 'MARET',
            '04' => 'APRIL',
            '05' => 'MEI',
            '06' => 'JUNI',
            '07' => 'JULI',
            '08' => 'AGUSTUS',
            '09' => 'SEPTEMBER',
            '10' => 'OKTOBER',
            '11' => 'NOVEMBER',
            '12' => 'DESEMBER'
        ];
        $bulanName = $bulanIndo[$month] ?? strtoupper($bulan);
        $tahunFull = $bulanDate->format('Y');

        // Initialize counters for each status
        $counters = [
            'Pegawai Tetap' => 0,
            'Pegawai Kontrak' => 0
        ];

        // Create new Spreadsheet object
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $headers = [
            'No',
            'Transaction ID',
            'Transfer Type',
            'Beneficiary ID',
            'Credited Account',
            'Receiver Name',
            'Amount',
            'NIP',
            'Remark',
            'Beneficiary email address',
            'Receiver Swift Code',
            'Receiver Cust Type',
            'Receiver Cust Residence'
        ];

        // Write headers
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }

        // Style headers
        $sheet->getStyle('A1:M1')->getFont()->setBold(true);
        $sheet->getStyle('A1:M1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        // Write data
        $row = 2;
        $no = 1;
        foreach ($payrollDetails as $detail) {
            $employee = $detail->employee;

            // Determine status code (1 = Tetap, 2 = Kontrak)
            $statusCode = ($employee->status_pegawai === 'Pegawai Kontrak') ? '2' : '1';

            // Increment counter for this status
            $counters[$employee->status_pegawai] = ($counters[$employee->status_pegawai] ?? 0) + 1;
            $urutan = str_pad($counters[$employee->status_pegawai], 3, '0', STR_PAD_LEFT);

            // Transaction ID: DDMMYY + Status Code + 3-digit sequential number
            $transactionId = $day . $month . $year . $statusCode . $urutan;

            $sheet->setCellValue('A' . $row, $no++);
            $sheet->setCellValue('B' . $row, $transactionId);
            $sheet->setCellValue('C' . $row, 'BCA');
            $sheet->setCellValue('D' . $row, '');
            $sheet->setCellValue('E' . $row, $employee->nomor_rekening ?? '');
            $sheet->setCellValue('F' . $row, $employee->nama ?? '');
            $sheet->setCellValue('G' . $row, $detail->gaji_bersih);
            $sheet->getStyle('G' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->setCellValue('H' . $row, '');
            $sheet->setCellValue('I' . $row, 'GAJI ' . $bulanName . ' ' . $tahunFull);
            $sheet->setCellValue('J' . $row, $employee->email ?? '');
            $sheet->setCellValue('K' . $row, '14');
            $sheet->setCellValue('L' . $row, '1');
            $sheet->setCellValue('M' . $row, '1');

            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Generate filename
        $filename = 'payroll_' . $bulan . '_' . str_replace(' ', '_', $status) . '.xlsx';

        // Output to browser
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }

    /**
     * Export detailed payroll data to Excel (.xlsx)
     */
    public function exportDetail($bulan, Request $request)
    {
        $user = Auth::user();
        $isUsersRole = $user->hasRole('users');

        // Manual authorization check
        $roleNames = $user->getRoleNames()->toArray();
        $hasAccess = $user->hasPermissionTo('payroll.view any')
            || in_array('Super Admin', $roleNames)
            || in_array('users', $roleNames);

        if (!$hasAccess) {
            abort(403, 'Unauthorized');
        }

        $status = $request->get('status');

        // Get payrolls header
        $payrollHeader = Payrolls::where('bulan', $bulan)
            ->when($status && !str_starts_with($status, 'THR'), function ($query) use ($status) {
                $query->where('status_pegawai', $status);
            })
            ->first();

        if (!$payrollHeader || $payrollHeader->status !== 'published') {
            return redirect()->route('payroll.index')
                ->with('error', 'Payroll belum dipublish!');
        }

        // Get payroll details (include soft-deleted employees)
        $payrollDetailsQuery = PayrollDetail::where('payroll_id', $payrollHeader->id)
            ->with(['employee' => function ($query) {
                $query->withTrashed();
            }, 'employee.kantorCabang', 'employee.jabatan', 'employee.user']);

        // If user has 'users' role, only export their own data
        if ($isUsersRole) {
            $employee = Employee::withTrashed()->where('user_id', $user->id)->first();
            if (!$employee) {
                return redirect()->route('payroll.index')
                    ->with('error', 'Data karyawan tidak ditemukan!');
            }
            $payrollDetailsQuery->where('employee_id', $employee->id);
        }

        $payrollDetails = $payrollDetailsQuery->get();

        // Get tunjangan list
        $tunjanganList = Tunjangan::all()->keyBy('id');

        // Parse tunjangan_lain from each payroll detail
        foreach ($payrollDetails as $detail) {
            $tunjanganLain = $detail->tunjangan_lain;
            if (is_string($tunjanganLain)) {
                $detail->tunjangan_lain_parsed = json_decode($tunjanganLain, true) ?? [];
            } else {
                $detail->tunjangan_lain_parsed = [];
            }
        }

        // Use PhpSpreadsheet to create real Excel file
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set header styles
        $headerStyle = [
            'font' => ['bold' => true],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '2777ff']],
            'font' => ['color' => ['rgb' => 'FFFFFF']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
        ];

        // Build dynamic headers based on tunjangan list
        $headers = [
            'No',
            'NIP',
            'Nama',
            'Cabang',
            'Jabatan',
            'Status',
            'Hari Kerja',
            'Hari Masuk',
            'Gaji Pokok',
            'Tunjangan Jabatan',
            'Insentif',
            'Uang Hadir',
            'Lembur',
            'Reward',
            'Lain-Lain',
        ];

        // Add tunjangan perusahaan columns
        foreach ($tunjanganList as $tunjangan) {
            $headers[] = $tunjangan->jenis_tunjangan . ' (Perusahaan)';
        }

        // Add total tunjangan column
        $headers[] = 'Total Tunjangan';

        // Add potongan columns
        foreach ($tunjanganList as $tunjangan) {
            $headers[] = $tunjangan->jenis_tunjangan . ' (Karyawan)';
        }

        // Add remaining columns
        $headers = array_merge($headers, [
            'Total Potongan',
            'Potongan Tidak Masuk',
            'Potongan Terlambat',
            'Kasbon',
            'Potongan Lain',
            'Pajak',
            'Gaji Bersih'
        ]);

        $column = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($column . '1', $header);
            $column++;
        }

        // Convert column count to Excel column letter (handles more than 26 columns)
        $lastColNum = count($headers);
        $lastColLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($lastColNum);
        $headerRange = 'A1:' . $lastColLetter . '1';
        $sheet->getStyle($headerRange)->applyFromArray($headerStyle);

        // Number format for Indonesian locale
        $numberFormat = '#,##0';

        // Data
        $no = 1;
        $row = 2;
        $tunjanganCount = count($tunjanganList);
        foreach ($payrollDetails as $detail) {
            $employee = $detail->employee;

            // Get tunjangan values from payroll detail
            $tunjanganValues = [];
            if (!empty($detail->tunjangan_lain_parsed)) {
                $tunjanganValues = $detail->tunjangan_lain_parsed;
            }

            $totalTunjangan = 0;
            $totalPotonganKaryawan = 0;

            // Calculate per tunjangan
            $tunjanganPerusahaan = [];
            $tunjanganKaryawan = [];

            foreach ($tunjanganList as $tunjangan) {
                $tunjanganId = (string) $tunjangan->id;

                // Get value from payroll or calculate from percentage
                $perusahaanValue = 0;
                $karyawanValue = 0;

                if (isset($tunjanganValues[$tunjanganId])) {
                    $perusahaanValue = isset($tunjanganValues[$tunjanganId]['perusahaan']) ? floatval($tunjanganValues[$tunjanganId]['perusahaan']) : 0;
                    $karyawanValue = isset($tunjanganValues[$tunjanganId]['karyawan']) ? floatval($tunjanganValues[$tunjanganId]['karyawan']) : 0;
                } else {
                    // Calculate from percentage
                    $perusahaanValue = ($tunjangan->perusahaan / 100) * $employee->gaji_pokok;
                    $karyawanValue = ($tunjangan->karyawan / 100) * $employee->gaji_pokok;
                }

                $tunjanganPerusahaan[] = $perusahaanValue;
                $tunjanganKaryawan[] = $karyawanValue;
                $totalTunjangan += $perusahaanValue;
                $totalPotonganKaryawan += $karyawanValue;
            }

            $sheet->setCellValue('A' . $row, $no++);
            $sheet->setCellValue('B' . $row, $employee->nip);
            $sheet->setCellValue('C' . $row, $employee->nama);
            $sheet->setCellValue('D' . $row, $employee->kantorCabang?->name ?? '-');
            $sheet->setCellValue('E' . $row, $employee->jabatan?->name ?? '-');
            $sheet->setCellValue('F' . $row, $payrollHeader->status_pegawai);
            $sheet->setCellValue('G' . $row, $detail->hari_kerja);
            $sheet->setCellValue('H' . $row, $detail->hari_masuk);
            $sheet->setCellValue('I' . $row, $employee->gaji_pokok)->getStyle('I' . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $sheet->setCellValue('J' . $row, $employee->tunjangan_jabatan)->getStyle('J' . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $sheet->setCellValue('K' . $row, $detail->insentif)->getStyle('K' . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $sheet->setCellValue('L' . $row, $detail->uang_hadir)->getStyle('L' . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $sheet->setCellValue('M' . $row, $detail->lembur)->getStyle('M' . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $sheet->setCellValue('N' . $row, $detail->reward)->getStyle('N' . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $sheet->setCellValue('O' . $row, $detail->lain_lain)->getStyle('O' . $row)->getNumberFormat()->setFormatCode($numberFormat);

            // Add tunjangan perusahaan columns
            $col = 'P';
            foreach ($tunjanganPerusahaan as $value) {
                $sheet->setCellValue($col . $row, $value)->getStyle($col . $row)->getNumberFormat()->setFormatCode($numberFormat);
                $col++;
            }

            // Total Tunjangan
            $sheet->setCellValue($col . $row, $totalTunjangan)->getStyle($col . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $col++;

            // Add potongan karyawan columns
            foreach ($tunjanganKaryawan as $value) {
                $sheet->setCellValue($col . $row, $value)->getStyle($col . $row)->getNumberFormat()->setFormatCode($numberFormat);
                $col++;
            }

            // Total Potongan
            $sheet->setCellValue($col . $row, $totalPotonganKaryawan)->getStyle($col . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $col++;

            // Other deductions
            $sheet->setCellValue($col . $row, $detail->potongan_tidak_masuk)->getStyle($col . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $col++;
            $sheet->setCellValue($col . $row, $detail->potongan_terlambat)->getStyle($col . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $col++;
            $sheet->setCellValue($col . $row, $detail->kasbon)->getStyle($col . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $col++;
            $sheet->setCellValue($col . $row, $detail->potongan_lain)->getStyle($col . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $col++;
            $sheet->setCellValue($col . $row, $detail->pph21_amount)->getStyle($col . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $col++;
            $sheet->setCellValue($col . $row, $detail->gaji_bersih)->getStyle($col . $row)->getNumberFormat()->setFormatCode($numberFormat);

            $row++;
        }

        // Auto-size columns
        $totalColumns = count($headers);
        for ($i = 1; $i <= $totalColumns; $i++) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i);
            $sheet->getColumnDimension($colLetter)->setAutoSize(true);
        }

        $filename = 'payroll_detail_' . $bulan . '_' . str_replace(' ', '_', $status) . '.xlsx';

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }

    /**
     * Show payroll for editing.
     */
    public function edit($bulan, Request $request)
    {
        Gate::authorize('update', Payrolls::class);

        // Get status from request or from existing payroll
        $status = $request->get('status');

        // Check if payroll is draft
        $payrollHeader = Payrolls::where('bulan', $bulan)
            ->when($status && !str_starts_with($status, 'THR'), function ($query) use ($status) {
                $query->where('status_pegawai', $status);
            })
            ->first();

        if ($payrollHeader && $payrollHeader->status !== 'draft') {
            return redirect()->route('payroll.index')
                ->with('error', 'Payroll yang sudah dipublish tidak dapat diedit!');
        }

        // If no status in request, get from existing payroll
        if (!$status && $payrollHeader) {
            $status = $payrollHeader->status_pegawai;
        }

        // Status is required
        if (!$status) {
            return redirect()->route('payroll.index')
                ->with('error', 'Status Pegawai wajib dipilih!');
        }

        return $this->create(new Request(['bulan' => $bulan, 'status' => $status]));
    }

    /**
     * Update payroll for a specific month.
     */
    public function update(Request $request, $bulan)
    {
        // Check if payroll is draft
        $status = $request->get('status');
        $payrollHeader = Payrolls::where('bulan', $bulan)
            ->when($status && !str_starts_with($status, 'THR'), function ($query) use ($status) {
                $query->where('status_pegawai', $status);
            })
            ->first();

        if ($payrollHeader && $payrollHeader->status !== 'draft') {
            return redirect()->route('payroll.index')
                ->with('error', 'Payroll yang sudah dipublish tidak dapat diedit!');
        }

        // Pass bulan from route parameter to the request
        $request->merge(['bulan' => $bulan]);
        return $this->store($request);
    }

    /**
     * Remove payroll for a specific month.
     */
    public function destroy($bulan)
    {
        Gate::authorize('delete', Payrolls::class);

        $status = request('status');

        // Check if payroll is draft
        $payrollHeader = Payrolls::where('bulan', $bulan)
            ->when($status && !str_starts_with($status, 'THR'), function ($query) use ($status) {
                $query->where('status_pegawai', $status);
            })
            ->first();

        if ($payrollHeader && $payrollHeader->status !== 'draft') {
            return redirect()->route('payroll.index')
                ->with('error', 'Payroll yang sudah dipublish tidak dapat dihapus!');
        }

        if ($payrollHeader) {
            $payrollHeader->delete();
        }

        return to_route('payroll.index');
    }

    /**
     * Check if payroll exists for a specific month.
     */
    public function check(Request $request)
    {
        $bulan = $request->get('bulan');
        $status = $request->get('status');

        if (!$bulan) {
            return response()->json(['exists' => false, 'message' => 'Bulan tidak valid']);
        }

        // Check if there's payroll for this month with the specific status
        $query = Payrolls::where('bulan', $bulan);

        // Handle THR status (e.g., "THR 2026")
        if ($status && str_starts_with($status, 'THR')) {
            $query->where('status_pegawai', $status);
        } elseif ($status) {
            $query->where('status_pegawai', $status);
        }

        $existing = $query->first();

        if ($existing) {
            return response()->json([
                'exists' => true,
                'message' => "Payroll bulan {$bulan} untuk status {$status} sudah ada!",
                'bulan' => $bulan,
                'status_pegawai' => $existing->status_pegawai,
                'payroll_status' => $existing->status
            ]);
        }

        return response()->json(['exists' => false]);
    }

    /**
     * Publish payroll for a month.
     */
    public function publish(Request $request)
    {
        Gate::authorize('publish', Payrolls::class);

        $bulan = $request->get('bulan', date('Y-m'));
        $status = $request->get('status');

        // Get payrolls for this bulan, filtered by status if provided
        $payrollQuery = Payrolls::where('bulan', $bulan);

        if ($status && !str_starts_with($status, 'THR')) {
            $payrollQuery->where('status_pegawai', $status);
        }

        $payrolls = $payrollQuery->get();

        if ($payrolls->isEmpty()) {
            return redirect()->route('payroll.index')
                ->with('error', 'Payroll tidak ditemukan!');
        }

        foreach ($payrolls as $payroll) {
            $payroll->update([
                'status' => 'published',
                'updated_by' => auth()->id(),
            ]);
        }

        $statusText = $status ? " untuk {$status}" : '';
        return redirect()->route('payroll.index')
            ->with('success', "Payroll bulan {$bulan}{$statusText} berhasil dipublish!");
    }
}
