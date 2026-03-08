<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmployeeStoreRequest;
use App\Http\Requests\EmployeeUpdateRequest;
use App\Http\Resources\EmployeeResource;
use App\Services\KantorCabangServices;
use App\Services\EmployeeServices;
use App\Services\JabatanServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    protected $employeeServices;
    protected $kantorCabangServices;
    protected $jabatanServices;

    public function __construct()
    {
        $this->employeeServices = new EmployeeServices;
        $this->kantorCabangServices = new KantorCabangServices;
        $this->jabatanServices = new JabatanServices;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Check authorization
        Gate::authorize('viewAny', \App\Models\Employee::class);

        $perPage = $request->get('perPage', 10);
        $searchNama = $request->input('searchNama');
        $searchNIP = $request->input('searchNIP');
        $searchKantorCabang = $request->input('searchKantorCabang');
        $searchJabatan = $request->input('searchJabatan');
        $sortField = $request->input('sortField', 'nama');
        $sortDirection = $request->input('sortDirection', 'asc');

        $query = $this->employeeServices->getAll();

        // Filter by nama
        if ($searchNama) {
            $query->where('nama', 'like', "%{$searchNama}%");
        }

        // Filter by NIP
        if ($searchNIP) {
            $query->where('nip', 'like', "%{$searchNIP}%");
        }

        // Filter by kantorCabang
        if ($searchKantorCabang) {
            $query->whereHas('kantorCabang', function ($q) use ($searchKantorCabang) {
                $q->where('name', 'like', "%{$searchKantorCabang}%");
            });
        }

        // Filter by jabatan
        if ($searchJabatan) {
            $query->whereHas('jabatan', function ($q) use ($searchJabatan) {
                $q->where('name', 'like', "%{$searchJabatan}%");
            });
        }

        // Sorting
        $query->orderBy($sortField, $sortDirection);

        $employees = $query->paginate($perPage);

        return Inertia::render('employees/index', [
            'employees' => EmployeeResource::collection($employees),
            'kantorCabang' => $this->kantorCabangServices->getAll()->orderBy('name', 'asc')->get(),
            'jabatan' => $this->jabatanServices->getAll()->orderBy('name', 'asc')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Check authorization
        Gate::authorize('create', \App\Models\Employee::class);

        $kantorCabang = $this->kantorCabangServices->getAll()->orderBy('name', 'asc')->get();
        $jabatan = $this->jabatanServices->getAll()->orderBy('name', 'asc')->get();

        return Inertia::render('employees/create', [
            'kantorCabang' => $kantorCabang,
            'jabatan' => $jabatan,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(EmployeeStoreRequest $request)
    {
        // Check authorization
        Gate::authorize('create', \App\Models\Employee::class);

        $this->employeeServices->create($request->validated());

        return redirect()->route('employees.index')
            ->with('success', 'Karyawan berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $employee = $this->employeeServices->findId($id);

        // Check authorization
        Gate::authorize('update', $employee);

        $kantorCabang = $this->kantorCabangServices->getAll()->orderBy('name', 'asc')->get();
        $jabatan = $this->jabatanServices->getAll()->orderBy('name', 'asc')->get();

        return Inertia::render('employees/edit', [
            'employee' => new EmployeeResource($employee->load('kantorCabang', 'jabatan')),
            'kantorCabang' => $kantorCabang,
            'jabatan' => $jabatan,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(EmployeeUpdateRequest $request, $id)
    {
        $employee = $this->employeeServices->findId($id);

        // Check authorization
        Gate::authorize('update', $employee);

        $this->employeeServices->update($id, $request->validated());

        return redirect()->route('employees.index')
            ->with('success', 'Karyawan berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $employee = $this->employeeServices->findId($id);

        // Check authorization
        Gate::authorize('delete', $employee);

        $this->employeeServices->delete($id);

        return to_route('employees.index');
    }

    /**
     * Export employees to Excel (.xlsx)
     */
    public function exportExcel(Request $request)
    {
        $searchNama = $request->input('searchNama');
        $searchNIP = $request->input('searchNIP');
        $searchKantorCabang = $request->input('searchKantorCabang');
        $searchJabatan = $request->input('searchJabatan');

        $query = $this->employeeServices->getAll();

        if ($searchNama) {
            $query->where('nama', 'like', "%{$searchNama}%");
        }
        if ($searchNIP) {
            $query->where('nip', 'like', "%{$searchNIP}%");
        }
        if ($searchKantorCabang) {
            $query->whereHas('kantorCabang', function ($q) use ($searchKantorCabang) {
                $q->where('name', 'like', "%{$searchKantorCabang}%");
            });
        }
        if ($searchJabatan) {
            $query->whereHas('jabatan', function ($q) use ($searchJabatan) {
                $q->where('name', 'like', "%{$searchJabatan}%");
            });
        }

        $employees = $query->with(['kantorCabang', 'jabatan'])->get();

        // Use PhpSpreadsheet to create real Excel file
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set header styles
        $headerStyle = [
            'font' => ['bold' => true],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => 'f97316']],
            'font' => ['color' => ['rgb' => 'FFFFFF']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
        ];
        $sheet->getStyle('A1:O1')->applyFromArray($headerStyle);

        // Headers
        $headers = ['No', 'NIP', 'Nama', 'Cabang', 'Jabatan', 'Status Pegawai', 'Tanggal Mulai Kerja', 'No. Rekening', 'PTKP', 'Gaji Pokok', 'Tunjangan Jabatan', 'Total Gaji', 'Potongan Tidak Masuk', 'Potongan Terlambat', 'Total Potongan'];
        $column = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($column . '1', $header);
            $column++;
        }

        // Number format for Indonesian locale (1.000.000)
        $numberFormat = '#,##0';

        // Data
        $no = 1;
        $row = 2;
        foreach ($employees as $employee) {
            $sheet->setCellValue('A' . $row, $no++);
            $sheet->setCellValue('B' . $row, $employee->nip);
            $sheet->setCellValue('C' . $row, $employee->nama);
            $sheet->setCellValue('D' . $row, $employee->kantorCabang?->name ?? '-');
            $sheet->setCellValue('E' . $row, $employee->jabatan?->name ?? '-');
            $sheet->setCellValue('F' . $row, $employee->status_pegawai ?? '-');
            $sheet->setCellValue('G' . $row, $employee->tanggal_mulai_kerja);
            $sheet->setCellValue('H' . $row, $employee->nomor_rekening ?? '-');
            $sheet->setCellValue('I' . $row, $employee->ptkp ?? '-');
            $sheet->setCellValue('J' . $row, $employee->gaji_pokok)->getStyle('J' . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $sheet->setCellValue('K' . $row, $employee->tunjangan_jabatan)->getStyle('K' . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $sheet->setCellValue('L' . $row, $employee->total_gaji)->getStyle('L' . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $sheet->setCellValue('M' . $row, $employee->potongan_tidak_masuk)->getStyle('M' . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $sheet->setCellValue('N' . $row, $employee->potongan_terlambat)->getStyle('N' . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $sheet->setCellValue('O' . $row, $employee->total_potongan)->getStyle('O' . $row)->getNumberFormat()->setFormatCode($numberFormat);
            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'O') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'employees_' . date('Y-m-d_His') . '.xlsx';

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }

    /**
     * Export employees to PDF
     */
    public function exportPdf(Request $request)
    {
        $searchNama = $request->input('searchNama');
        $searchNIP = $request->input('searchNIP');
        $searchKantorCabang = $request->input('searchKantorCabang');
        $searchJabatan = $request->input('searchJabatan');

        $query = $this->employeeServices->getAll();

        if ($searchNama) {
            $query->where('nama', 'like', "%{$searchNama}%");
        }
        if ($searchNIP) {
            $query->where('nip', 'like', "%{$searchNIP}%");
        }
        if ($searchKantorCabang) {
            $query->whereHas('kantorCabang', function ($q) use ($searchKantorCabang) {
                $q->where('name', 'like', "%{$searchKantorCabang}%");
            });
        }
        if ($searchJabatan) {
            $query->whereHas('jabatan', function ($q) use ($searchJabatan) {
                $q->where('name', 'like', "%{$searchJabatan}%");
            });
        }

        $employees = $query->with(['kantorCabang', 'jabatan'])->get();

        // Format number Indonesian style
        $formatRupiah = function ($value) {
            return number_format($value, 0, ',', '.');
        };

        // Use DomPDF to create proper PDF with same columns as Excel
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Daftar Karyawan</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 9px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 8px; }
        th { background-color: #f97316; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .header { text-align: center; margin-bottom: 15px; }
        .header h1 { margin: 0; color: #f97316; font-size: 16px; }
        .header p { margin: 3px 0; color: #666; font-size: 10px; }
        .text-right { text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Daftar Karyawan</h1>
        <p>Tanggal: ' . date('d-m-Y') . '</p>
        <p>Total Karyawan: ' . count($employees) . '</p>
    </div>
    <table>
        <thead>
            <tr>
                <th style="width: 20px; text-align: center;">No</th>
                <th style="width: 60px;">NIP</th>
                <th>Nama</th>
                <th>Kantor Cabanga</th>
                <th>Jabatan</th>
                <th style="width: 50px;">Status</th>
                <th style="width: 60px;">Tgl Mulai</th>
                <th style="width: 80px;">No. Rekening</th>
                <th style="width: 40px;">PTKP</th>
                <th class="text-right">Gaji Pokok</th>
                <th class="text-right">Tunjangan Jabatan</th>
                <th class="text-right">Total Gaji</th>
                <th class="text-right">Pot. Tidak Masuk</th>
                <th class="text-right">Pot. Terlambat</th>
                <th class="text-right">Total Potongan</th>
            </tr>
        </thead>
        <tbody>';

        $no = 1;
        foreach ($employees as $employee) {
            $html .= '<tr>
                <td style="text-align: center;">' . $no++ . '</td>
                <td>' . $employee->nip . '</td>
                <td>' . $employee->nama . '</td>
                <td>' . ($employee->kantorCabang?->name ?? '-') . '</td>
                <td>' . ($employee->jabatan?->name ?? '-') . '</td>
                <td>' . ($employee->status_pegawai ?? '-') . '</td>
                <td>' . $employee->tanggal_mulai_kerja . '</td>
                <td>' . ($employee->nomor_rekening ?? '-') . '</td>
                <td>' . ($employee->ptkp ?? '-') . '</td>
                <td class="text-right">' . $formatRupiah($employee->gaji_pokok) . '</td>
                <td class="text-right">' . $formatRupiah($employee->tunjangan_jabatan) . '</td>
                <td class="text-right">' . $formatRupiah($employee->total_gaji) . '</td>
                <td class="text-right">' . $formatRupiah($employee->potongan_tidak_masuk) . '</td>
                <td class="text-right">' . $formatRupiah($employee->potongan_terlambat) . '</td>
                <td class="text-right">' . $formatRupiah($employee->total_potongan) . '</td>
            </tr>';
        }

        $html .= '</tbody>
    </table>
</body>
</html>';

        $dompdf = new \Dompdf\Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        $filename = 'employees_' . date('Y-m-d_His') . '.pdf';

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
