<?php

namespace App\Http\Controllers;

use App\Http\Requests\PayrollStoreRequest;
use App\Http\Requests\PayrollUpdateRequest;
use App\Http\Resources\PayrollResource;
use App\Models\Employee;
use App\Models\Payrolls;
use App\Models\PayrollDetail;
use App\Services\PayrollServices;
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
            // Get employee data associated with this user
            $employee = Employee::where('user_id', $user->id)->first();

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

        // Check if payrolls header exists
        $payrollHeader = Payrolls::where('bulan', $bulan)
            ->where('status_pegawai', $status)
            ->first();

        $payrollDetails = collect([]);
        if ($payrollHeader) {
            $payrollDetails = PayrollDetail::where('payroll_id', $payrollHeader->id)
                ->with(['employee', 'employee.kantorCabang', 'employee.jabatan'])
                ->get()
                ->keyBy('employee_id');
        }

        $employees = \App\Models\Employee::with(['kantorCabang', 'jabatan'])
            ->where('status_pegawai', $status)
            ->orderBy('nama', 'asc')
            ->get();

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
                'kantorCabang' => $employee->kantorCabang?->name,
                'jabatan' => $employee->jabatan?->name,
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
            ->when($status, function ($query) use ($status) {
                $query->where('status_pegawai', $status);
            })
            ->first();

        if (!$payrollHeader) {
            return redirect()->route('payroll.index')
                ->with('error', 'Payroll tidak ditemukan!');
        }

        // For users role, only show their own data
        if ($isUsersRole) {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) {
                return redirect()->route('payroll.index')
                    ->with('error', 'Data karyawan tidak ditemukan!');
            }

            // Get only this employee's payroll detail
            $payrollDetail = PayrollDetail::where('payroll_id', $payrollHeader->id)
                ->where('employee_id', $employee->id)
                ->with(['employee', 'employee.kantorCabang', 'employee.jabatan'])
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
            ] : null;
            $employeeData['tunjangan'] = $tunjanganList->map(function($tunjangan) use ($existingTunjangan, $employee) {
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

        // Get employees based on status filter
        $employees = \App\Models\Employee::with(['kantorCabang', 'jabatan'])
            ->where('status_pegawai', $payrollHeader->status_pegawai)
            ->orderBy('nama', 'asc')
            ->get();

        // Get payroll details
        $payrollDetails = PayrollDetail::where('payroll_id', $payrollHeader->id)
            ->with(['employee', 'employee.kantorCabang', 'employee.jabatan'])
            ->get()
            ->keyBy('employee_id');

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
                    'tunjangan_lain' => $existing->tunjangan_lain,
                    'potongan_tidak_masuk' => (float) $existing->potongan_tidak_masuk,
                    'potongan_terlambat' => (float) $existing->potongan_terlambat,
                    'potongan_lain' => (float) $existing->potongan_lain,
                    'total_gaji' => (float) $existing->total_gaji,
                    'total_potongan' => (float) $existing->total_potongan,
                    'gaji_bersih' => (float) $existing->gaji_bersih,
                    'status' => $payrollHeader->status,
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

        // Get payroll details
        $payrollDetailsQuery = PayrollDetail::where('payroll_id', $payrollHeader->id)
            ->with(['employee', 'employee.kantorCabang', 'employee.jabatan']);

        // If user has 'users' role, only export their own data
        if ($isUsersRole) {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) {
                return redirect()->route('payroll.index')
                    ->with('error', 'Data karyawan tidak ditemukan!');
            }
            $payrollDetailsQuery->where('employee_id', $employee->id);
        }

        $payrollDetails = $payrollDetailsQuery->get();

        // Generate Excel-like CSV data
        $filename = 'payroll_' . $bulan . '_' . str_replace(' ', '_', $status) . '.csv';

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');

        $output = fopen('php://output', 'w');

        // Header CSV
        fputcsv($output, [
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
        ], ';');

        $no = 1;
        foreach ($payrollDetails as $detail) {
            $employee = $detail->employee;

            fputcsv($output, [
                $no++,
                'PAY-' . $bulan . '-' . str_pad($detail->id, 4, '0', STR_PAD_LEFT),
                'BATCH',
                $employee->id,
                $employee->no_rekening ?? '',
                $employee->nama ?? '',
                number_format($detail->gaji_bersih, 0, ',', '.'),
                $employee->nip ?? '',
                'Gaji Bulan ' . $bulan . ' - ' . ($employee->jabatan?->name ?? ''),
                $employee->email ?? '',
                '',
                'INDIVIDUAL',
                'RESIDENT'
            ], ';');
        }

        fclose($output);
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
            ->when($status, function ($query) use ($status) {
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
            ->when($status, function ($query) use ($status) {
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
            ->when($status, function ($query) use ($status) {
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

        if ($status) {
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

        if ($status) {
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
