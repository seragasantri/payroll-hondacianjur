<?php

namespace App\Http\Controllers;

use App\Http\Requests\PayrollStoreRequest;
use App\Http\Requests\PayrollUpdateRequest;
use App\Http\Resources\PayrollResource;
use App\Services\PayrollServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PayrollController extends Controller
{
    protected $payrollServices;

    public function __construct()
    {
        $this->payrollServices = new \App\Services\PayrollServices();
    }

    /**
     * Display a listing of the resource (grouped by bulan).
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', \App\Models\Payroll::class);

        $payrollSummary = \App\Models\Payroll::select('bulan')
            ->selectRaw('COUNT(*) as total_karyawan')
            ->selectRaw('SUM(gaji_bersih) as total_gaji_bersih')
            ->selectRaw('MIN(status) as status')
            ->groupBy('bulan')
            ->orderBy('bulan', 'desc')
            ->paginate(12);

        return Inertia::render('payroll/index', [
            'payrollSummary' => $payrollSummary
        ]);
    }

    /**
     * Show payroll for a specific the form for creating month.
     */
    public function create(Request $request)
    {
        Gate::authorize('create', \App\Models\Payroll::class);

        $bulan = $request->get('bulan', date('Y-m'));

        $payrollData = \App\Models\Payroll::where('bulan', $bulan)
            ->with(['employee', 'employee.divisi', 'employee.jabatan'])
            ->get()
            ->keyBy('employee_id');

        $employees = \App\Models\Employee::with(['divisi', 'jabatan'])
            ->orderBy('nama', 'asc')
            ->get();

        $tunjanganList = \App\Models\Tunjangan::orderBy('jenis_tunjangan', 'asc')->get();

        $employeesWithPayroll = $employees->map(function ($employee) use ($payrollData, $bulan, $tunjanganList) {
            $existing = $payrollData->get($employee->id);

            // Parse existing tunjangan data
            $existingTunjangan = [];
            if ($existing && $existing->tunjangan_lain) {
                $existingTunjangan = json_decode($existing->tunjangan_lain, true) ?? [];
            }

            return [
                'id' => $employee->id,
                'nip' => $employee->nip,
                'nama' => $employee->nama,
                'divisi' => $employee->divisi?->name,
                'jabatan' => $employee->jabatan?->name,
                'gaji_pokok' => (float) $employee->gaji_pokok,
                'tunjangan_jabatan' => (float) $employee->tunjangan_jabatan,
                'potongan_tidak_masuk' => (float) $employee->potongan_tidak_masuk,
                'potongan_terlambat' => (float) $employee->potongan_terlambat,
                'tunjangan' => $tunjanganList->map(function($tunjangan) use ($existingTunjangan, $employee) {
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
                    'tunjangan_lain' => $existing->tunjangan_lain,
                    'potongan_tidak_masuk' => (float) $existing->potongan_tidak_masuk,
                    'potongan_terlambat' => (float) $existing->potongan_terlambat,
                    'potongan_lain' => (float) $existing->potongan_lain,
                    'total_gaji' => (float) $existing->total_gaji,
                    'total_potongan' => (float) $existing->total_potongan,
                    'gaji_bersih' => (float) $existing->gaji_bersih,
                    'status' => $existing->status,
                ] : null
            ];
        });

        return Inertia::render('payroll/create', [
            'bulan' => $bulan,
            'employees' => $employeesWithPayroll,
            'tunjanganList' => $tunjanganList
        ]);
    }

    /**
     * Store payroll for a specific month (batch).
     */
    public function store(Request $request)
    {
        Gate::authorize('create', \App\Models\Payroll::class);

        $bulan = $request->get('bulan');

        if (!$bulan) {
            return response()->json(['error' => 'Bulan is required'], 400);
        }

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

            // Calculate total tunjangan perusahaan and karyawan
            $tunjanganLain = $data['tunjangan'] ?? [];
            $totalTunjanganPerusahaan = 0;
            $totalPotonganKaryawan = 0;

            foreach ($tunjanganLain as $t) {
                $totalTunjanganPerusahaan += (float) ($t['perusahaan'] ?? 0);
                $totalPotonganKaryawan += (float) ($t['karyawan'] ?? 0);
            }

            $existing = \App\Models\Payroll::where('employee_id', $employeeId)
                ->where('bulan', $bulan)
                ->first();

            if ($existing) {
                $existing->update([
                    'hari_kerja' => $hariKerja,
                    'hari_masuk' => $hariMasuk,
                    'jam_terlambat' => $jamTerlambat,
                    'insentif' => $insentif,
                    'tunjangan_lain' => json_encode($tunjanganLain),
                    'potongan_tidak_masuk' => $potonganTidakMasuk,
                    'potongan_terlambat' => $potonganTerlambat,
                    'potongan_lain' => $potonganLain,
                    'status' => $data['status'] ?? 'draft',
                    'updated_by' => auth()->id(),
                ]);
            } else {
                \App\Models\Payroll::create([
                    'employee_id' => $employeeId,
                    'bulan' => $bulan,
                    'hari_kerja' => $hariKerja,
                    'hari_masuk' => $hariMasuk,
                    'jam_terlambat' => $jamTerlambat,
                    'gaji_pokok' => (float) $employee->gaji_pokok,
                    'tunjangan_jabatan' => (float) $employee->tunjangan_jabatan,
                    'insentif' => $insentif,
                    'tunjangan_lain' => json_encode($tunjanganLain),
                    'potongan_tidak_masuk' => $potonganTidakMasuk,
                    'potongan_terlambat' => $potonganTerlambat,
                    'potongan_lain' => $potonganLain,
                    'status' => $data['status'] ?? 'draft',
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
                ]);
            }
        }

        return redirect()->route('payroll.index')
            ->with('success', 'Payroll bulan ' . $bulan . ' berhasil disimpan!');
    }

    /**
     * Show payroll detail for a specific month (view only).
     */
    public function show($bulan)
    {
        Gate::authorize('viewAny', \App\Models\Payroll::class);

        $payrollData = \App\Models\Payroll::where('bulan', $bulan)
            ->with(['employee', 'employee.divisi', 'employee.jabatan'])
            ->get()
            ->keyBy('employee_id');

        $employees = \App\Models\Employee::with(['divisi', 'jabatan'])
            ->orderBy('nama', 'asc')
            ->get();

        $tunjanganList = \App\Models\Tunjangan::orderBy('jenis_tunjangan', 'asc')->get();

        $employeesWithPayroll = $employees->map(function ($employee) use ($payrollData, $bulan, $tunjanganList) {
            $existing = $payrollData->get($employee->id);

            $existingTunjangan = [];
            if ($existing && $existing->tunjangan_lain) {
                $existingTunjangan = json_decode($existing->tunjangan_lain, true) ?? [];
            }

            return [
                'id' => $employee->id,
                'nip' => $employee->nip,
                'nama' => $employee->nama,
                'divisi' => $employee->divisi?->name,
                'jabatan' => $employee->jabatan?->name,
                'gaji_pokok' => (float) $employee->gaji_pokok,
                'tunjangan_jabatan' => (float) $employee->tunjangan_jabatan,
                'potongan_tidak_masuk' => (float) $employee->potongan_tidak_masuk,
                'potongan_terlambat' => (float) $employee->potongan_terlambat,
                'tunjangan' => $tunjanganList->map(function($tunjangan) use ($existingTunjangan, $employee) {
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
                    'tunjangan_lain' => $existing->tunjangan_lain,
                    'potongan_tidak_masuk' => (float) $existing->potongan_tidak_masuk,
                    'potongan_terlambat' => (float) $existing->potongan_terlambat,
                    'potongan_lain' => (float) $existing->potongan_lain,
                    'total_gaji' => (float) $existing->total_gaji,
                    'total_potongan' => (float) $existing->total_potongan,
                    'gaji_bersih' => (float) $existing->gaji_bersih,
                    'status' => $existing->status,
                ] : null
            ];
        });

        return Inertia::render('payroll/detail', [
            'bulan' => $bulan,
            'employees' => $employeesWithPayroll,
            'tunjanganList' => $tunjanganList
        ]);
    }

    /**
     * Show payroll for editing.
     */
    public function edit($bulan)
    {
        Gate::authorize('update', \App\Models\Payroll::class);

        // Check if payroll is draft
        $payrollStatus = \App\Models\Payroll::where('bulan', $bulan)->first();
        if ($payrollStatus && $payrollStatus->status !== 'draft') {
            return redirect()->route('payroll.index')
                ->with('error', 'Payroll yang sudah dipublish tidak dapat diedit!');
        }

        return $this->create(new Request(['bulan' => $bulan]));
    }

    /**
     * Update payroll for a specific month.
     */
    public function update(Request $request, $bulan)
    {
        // Check if payroll is draft
        $payrollStatus = \App\Models\Payroll::where('bulan', $bulan)->first();
        if ($payrollStatus && $payrollStatus->status !== 'draft') {
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
        Gate::authorize('delete', \App\Models\Payroll::class);

        // Check if payroll is draft
        $payrollStatus = \App\Models\Payroll::where('bulan', $bulan)->first();
        if ($payrollStatus && $payrollStatus->status !== 'draft') {
            return redirect()->route('payroll.index')
                ->with('error', 'Payroll yang sudah dipublish tidak dapat dihapus!');
        }

        \App\Models\Payroll::where('bulan', $bulan)->delete();

        return to_route('payroll.index');
    }

    /**
     * Publish payroll for a month.
     */
    public function publish(Request $request)
    {
        Gate::authorize('publish', \App\Models\Payroll::class);

        $bulan = $request->get('bulan', date('Y-m'));

        $count = $this->payrollServices->publishPayroll($bulan);

        return redirect()->route('payroll.index')
            ->with('success', "Payroll bulan {$bulan} berhasil dipublish!");
    }
}
