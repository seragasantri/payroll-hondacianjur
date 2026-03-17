<?php

namespace App\Http\Controllers;

use App\Models\KantorCabang;
use App\Models\Payrolls;
use App\Models\PayrollDetail;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Borders;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use Illuminate\Support\Facades\Auth;

class LaporanController extends Controller
{
    public function index(Request $request)
    {
        $tahun = $request->get('tahun', date('Y'));
        $search = $request->get('searchName', '');
        $sortField = $request->get('sortField', 'name');
        $sortDirection = $request->get('sortDirection', 'asc');
        $perPage = $request->get('perPage', 10);

        $query = KantorCabang::query();

        // Search filter
        if ($search) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        // Sort
        $query->orderBy($sortField, $sortDirection);

        $cabangs = $query->paginate($perPage)->withQueryString();

        return Inertia::render('laporan/index', [
            'cabangs' => $cabangs,
            'tahun' => (int) $tahun,
            'filters' => [
                'searchName' => $search,
                'sortField' => $sortField,
                'sortDirection' => $sortDirection,
                'perPage' => (int) $perPage,
            ],
        ]);
    }

    /**
     * Export BPJS Kesehatan to Excel with multiple sheets (one per month with data).
     */
    public function exportBpjsKes($cabangId, $tahun, Request $request)
    {
        // Get kantor cabang
        $cabang = KantorCabang::findOrFail($cabangId);

        // Get all published payrolls for the selected year and cabang (including THR)
        $payrollHeaders = Payrolls::where(function ($query) use ($tahun) {
            $query->where('bulan', 'like', $tahun . '-%')
                ->orWhere('bulan', 'like', 'THR ' . $tahun);
        })
            ->where('status', 'published')
            ->orderBy('bulan', 'asc')
            ->get();

        if ($payrollHeaders->isEmpty()) {
            return redirect()->route('laporan.index', ['tahun' => $tahun])
                ->with('error', 'Tidak ada data payroll untuk tahun tersebut!');
        }

        // Indonesian month names
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

        // Create Excel
        $spreadsheet = new Spreadsheet();

        // Remove default sheet
        $spreadsheet->removeSheetByIndex(0);

        $hasData = false;

        foreach ($payrollHeaders as $payrollHeader) {
            $bulan = $payrollHeader->bulan;

            // Handle THR format
            if (str_starts_with($bulan, 'THR ')) {
                $bulanName = 'THR';
            } else {
                $bulanDate = \Carbon\Carbon::parse($bulan . '-01');
                $month = $bulanDate->format('m');
                $bulanName = $bulanIndo[$month] ?? strtoupper($month);
            }

            // Get payroll details with employee data for this cabang
            $payrollDetails = PayrollDetail::where('payroll_id', $payrollHeader->id)
                ->whereHas('employee', function ($query) use ($cabangId) {
                    $query->where('kantor_cabang_id', $cabangId);
                })
                ->with(['employee' => function ($query) {
                    $query->withTrashed();
                }, 'employee.kantorCabang', 'employee.jabatan'])
                ->get();

            if ($payrollDetails->isEmpty()) {
                continue; // Skip months with no data
            }

            $hasData = true;

            // Create new sheet
            $sheet = $spreadsheet->createSheet();
            $sheet->setTitle($bulanName);

            // Set column widths
            $sheet->getColumnDimension('A')->setWidth(5);
            $sheet->getColumnDimension('B')->setWidth(15);
            $sheet->getColumnDimension('C')->setWidth(15);
            $sheet->getColumnDimension('D')->setWidth(20);
            $sheet->getColumnDimension('E')->setWidth(25);
            $sheet->getColumnDimension('F')->setWidth(8);
            $sheet->getColumnDimension('G')->setWidth(10);
            $sheet->getColumnDimension('H')->setWidth(15);
            $sheet->getColumnDimension('I')->setWidth(15);
            $sheet->getColumnDimension('J')->setWidth(15);
            $sheet->getColumnDimension('K')->setWidth(15);

            // Set row heights for header area
            $sheet->getRowDimension(1)->setRowHeight(80);
            $sheet->getRowDimension(2)->setRowHeight(30);
            $sheet->getRowDimension(3)->setRowHeight(25);
            $sheet->getRowDimension(4)->setRowHeight(25);
            $sheet->getRowDimension(5)->setRowHeight(25);

            // Logo - Row 1
            $logoPath = public_path('assets/images/logo_2.png');
            if (file_exists($logoPath)) {
                $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                $drawing->setPath($logoPath);
                $drawing->setWidth(80);
                $drawing->setHeight(80);
                $drawing->setCoordinates('A1');
                $drawing->setOffsetX(5);
                $drawing->setOffsetY(5);
                $drawing->setWorksheet($sheet);
            }

            // Company Name - Row 2 (next to logo)
            $sheet->mergeCells('B2:K2');
            $sheet->setCellValue('B2', 'PUSAKA MOTOR UTAMA');
            $sheet->getStyle('B2')->getFont()->setSize(16)->setBold(true);
            $sheet->getStyle('B2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('B2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

            // Title - Row 3
            $sheet->mergeCells('B3:K3');
            $sheet->setCellValue('B3', 'LAPORAN BPJS KESEHATAN');
            $sheet->getStyle('B3')->getFont()->setSize(14)->setBold(true);
            $sheet->getStyle('B3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Period - Row 4
            $sheet->mergeCells('B4:K4');
            $sheet->setCellValue('B4', 'PERIODE : ' . $bulanName . ' ' . $tahun);
            $sheet->getStyle('B4')->getFont()->setSize(12)->setBold(true);
            $sheet->getStyle('B4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Branch - Row 5
            $sheet->mergeCells('B5:K5');
            $sheet->setCellValue('B5', 'CABANG : ' . strtoupper($cabang->name));
            $sheet->getStyle('B5')->getFont()->setSize(12)->setBold(true);
            $sheet->getStyle('B5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Empty row
            $sheet->mergeCells('A6:K6');

            // Table Header - Row 7
            $headerRow = 7;
            $headers = ['NO', 'NIP', 'KPJ', 'NIK', 'NAMA', 'SEX', 'STATUS', 'UPAH POKOK', 'JPK PERUSAHAAN', 'JPK KARYAWAN', 'TOTAL PREMI'];
            $column = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($column . $headerRow, $header);
                $column++;
            }

            // Style header
            $sheet->getStyle('A' . $headerRow . ':K' . $headerRow)->getFont()->setBold(true);
            $sheet->getStyle('A' . $headerRow . ':K' . $headerRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('A' . $headerRow . ':K' . $headerRow)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle('A' . $headerRow . ':K' . $headerRow)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('D8BFD8');

            // Data rows - Row 8 onwards
            $row = 8;
            $no = 1;
            $totalUpahPokok = 0;
            $totalJpkPerusahaan = 0;
            $totalJpkKaryawan = 0;
            $totalPremi = 0;

            foreach ($payrollDetails as $detail) {
                $employee = $detail->employee;

                // Getjk value from employee
                $jk = $employee->jenis_kelamin === 'laki-laki' ? 'L' : 'P';

                // Get tunjangan values from tunjangan_lain JSON
                $tunjanganData = json_decode($detail->tunjangan_lain, true) ?? [];

                // BPJS Kesehatan id = 1 (server uses 1-5 instead of 5-9)
                $bpjsPerusahaan = isset($tunjanganData['1']['perusahaan']) ? (float) $tunjanganData['1']['perusahaan'] : 0;
                $bpjsKaryawan = isset($tunjanganData['1']['karyawan']) ? (float) $tunjanganData['1']['karyawan'] : 0;
                $totalPremiRow = $bpjsPerusahaan + $bpjsKaryawan;

                $sheet->setCellValue('A' . $row, $no);
                $sheet->setCellValue('B' . $row, $employee->nip ?? '');
                $sheet->setCellValue('C' . $row, $employee->kjt ?? ''); // KPJ
                $sheet->setCellValue('D' . $row, $employee->nik ?? '');
                $sheet->setCellValue('E' . $row, $employee->nama ?? '');
                $sheet->setCellValue('F' . $row, $jk);
                $sheet->setCellValue('G' . $row, $employee->ptkp ?? 'TK/0');
                $sheet->setCellValue('H' . $row, $detail->gaji_pokok);
                $sheet->setCellValue('I' . $row, $bpjsPerusahaan);
                $sheet->setCellValue('J' . $row, $bpjsKaryawan);
                $sheet->setCellValue('K' . $row, $totalPremiRow);

                // Style data row
                $sheet->getStyle('A' . $row . ':K' . $row)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
                $sheet->getStyle('A' . $row . ':F' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('G' . $row . ':K' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                // Number format
                $sheet->getStyle('H' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('I' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('J' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('K' . $row)->getNumberFormat()->setFormatCode('#,##0');

                $totalUpahPokok += (float) $detail->gaji_pokok;
                $totalJpkPerusahaan += $bpjsPerusahaan;
                $totalJpkKaryawan += $bpjsKaryawan;
                $totalPremi += $totalPremiRow;

                $no++;
                $row++;
            }

            // Total row
            $sheet->mergeCells('A' . $row . ':G' . $row);
            $sheet->setCellValue('A' . $row, 'JUMLAH :');
            $sheet->getStyle('A' . $row)->getFont()->setBold(true);
            $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            $sheet->setCellValue('H' . $row, $totalUpahPokok);
            $sheet->setCellValue('I' . $row, $totalJpkPerusahaan);
            $sheet->setCellValue('J' . $row, $totalJpkKaryawan);
            $sheet->setCellValue('K' . $row, $totalPremi);

            $sheet->getStyle('A' . $row . ':K' . $row)->getFont()->setBold(true);
            $sheet->getStyle('A' . $row . ':K' . $row)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle('A' . $row . ':K' . $row)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('D8BFD8');
            $sheet->getStyle('H' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('I' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('J' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('K' . $row)->getNumberFormat()->setFormatCode('#,##0');
        }

        if (!$hasData) {
            return redirect()->route('laporan.index', ['tahun' => $tahun])
                ->with('error', 'Tidak ada data payroll untuk cabang tersebut!');
        }

        // Output file
        $filename = 'BPJS_Kesehatan_' . $tahun . '_' . strtoupper($cabang->name) . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
        exit;
    }

    /**
     * Export BPJS TK (Ketenagakerjaan) to Excel with multiple sheets (one per month with data).
     */
    public function exportBpjsTk($cabangId, $tahun, Request $request)
    {
        // Get kantor cabang
        $cabang = KantorCabang::findOrFail($cabangId);

        // Get all published payrolls for the selected year and cabang (including THR)
        $payrollHeaders = Payrolls::where(function ($query) use ($tahun) {
            $query->where('bulan', 'like', $tahun . '-%')
                ->orWhere('bulan', 'like', 'THR ' . $tahun);
        })
            ->where('status', 'published')
            ->orderBy('bulan', 'asc')
            ->get();

        if ($payrollHeaders->isEmpty()) {
            return redirect()->route('laporan.index', ['tahun' => $tahun])
                ->with('error', 'Tidak ada data payroll untuk tahun tersebut!');
        }

        // Indonesian month names
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

        // BPJS TK tunjangan IDs (server uses 1-5: 1=BPJS Kes, 2=JHT, 3=JKK, 4=JKM, 5=Pensiun)
        $bpjsTkIds = [
            'jkk' => '3',
            'jkm' => '4',
            'jht' => '2',
            'pensiun' => '5',
        ];

        // Create Excel
        $spreadsheet = new Spreadsheet();

        // Remove default sheet
        $spreadsheet->removeSheetByIndex(0);

        $hasData = false;

        foreach ($payrollHeaders as $payrollHeader) {
            $bulan = $payrollHeader->bulan;

            // Handle THR format
            if (str_starts_with($bulan, 'THR ')) {
                $bulanName = 'THR';
            } else {
                $bulanDate = \Carbon\Carbon::parse($bulan . '-01');
                $month = $bulanDate->format('m');
                $bulanName = $bulanIndo[$month] ?? strtoupper($month);
            }

            // Get payroll details with employee data for this cabang
            $payrollDetails = PayrollDetail::where('payroll_id', $payrollHeader->id)
                ->whereHas('employee', function ($query) use ($cabangId) {
                    $query->where('kantor_cabang_id', $cabangId);
                })
                ->with(['employee' => function ($query) {
                    $query->withTrashed();
                }, 'employee.kantorCabang', 'employee.jabatan'])
                ->get();

            if ($payrollDetails->isEmpty()) {
                continue; // Skip months with no data
            }

            $hasData = true;

            // Create new sheet
            $sheet = $spreadsheet->createSheet();
            $sheet->setTitle($bulanName);

            // Set column widths
            $sheet->getColumnDimension('A')->setWidth(5);
            $sheet->getColumnDimension('B')->setWidth(15);
            $sheet->getColumnDimension('C')->setWidth(15);
            $sheet->getColumnDimension('D')->setWidth(20);
            $sheet->getColumnDimension('E')->setWidth(25);
            $sheet->getColumnDimension('F')->setWidth(8);
            $sheet->getColumnDimension('G')->setWidth(10);
            $sheet->getColumnDimension('H')->setWidth(15);
            $sheet->getColumnDimension('I')->setWidth(12);
            $sheet->getColumnDimension('J')->setWidth(12);
            $sheet->getColumnDimension('K')->setWidth(12);
            $sheet->getColumnDimension('L')->setWidth(12);
            $sheet->getColumnDimension('M')->setWidth(15);

            // Set row heights for header area
            $sheet->getRowDimension(1)->setRowHeight(80);
            $sheet->getRowDimension(2)->setRowHeight(30);
            $sheet->getRowDimension(3)->setRowHeight(25);
            $sheet->getRowDimension(4)->setRowHeight(25);
            $sheet->getRowDimension(5)->setRowHeight(25);

            // Logo - Row 1
            $logoPath = public_path('assets/images/logo_2.png');
            if (file_exists($logoPath)) {
                $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                $drawing->setPath($logoPath);
                $drawing->setWidth(80);
                $drawing->setHeight(80);
                $drawing->setCoordinates('A1');
                $drawing->setOffsetX(5);
                $drawing->setOffsetY(5);
                $drawing->setWorksheet($sheet);
            }

            // Company Name - Row 2 (next to logo)
            $sheet->mergeCells('B2:M2');
            $sheet->setCellValue('B2', 'PUSAKA MOTOR UTAMA');
            $sheet->getStyle('B2')->getFont()->setSize(16)->setBold(true);
            $sheet->getStyle('B2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('B2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

            // Title - Row 3
            $sheet->mergeCells('B3:M3');
            $sheet->setCellValue('B3', 'LAPORAN BPJS KETENAGAKERJAAN');
            $sheet->getStyle('B3')->getFont()->setSize(14)->setBold(true);
            $sheet->getStyle('B3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Period - Row 4
            $sheet->mergeCells('B4:M4');
            $sheet->setCellValue('B4', 'PERIODE : ' . $bulanName . ' ' . $tahun);
            $sheet->getStyle('B4')->getFont()->setSize(12)->setBold(true);
            $sheet->getStyle('B4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Branch - Row 5
            $sheet->mergeCells('B5:M5');
            $sheet->setCellValue('B5', 'CABANG : ' . strtoupper($cabang->name));
            $sheet->getStyle('B5')->getFont()->setSize(12)->setBold(true);
            $sheet->getStyle('B5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Empty row
            $sheet->mergeCells('A6:M6');

            // Table Header - Row 7
            $headerRow = 7;
            $headers = ['NO', 'NIP', 'KPJ', 'NIK', 'NAMA', 'SEX', 'STATUS', 'UPAH POKOK', 'JKK', 'JKM', 'JHT', 'PENSIUN', 'TOTAL PREMI'];
            $column = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($column . $headerRow, $header);
                $column++;
            }

            // Style header
            $sheet->getStyle('A' . $headerRow . ':M' . $headerRow)->getFont()->setBold(true);
            $sheet->getStyle('A' . $headerRow . ':M' . $headerRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('A' . $headerRow . ':M' . $headerRow)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle('A' . $headerRow . ':M' . $headerRow)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F5F5DC');

            // Data rows - Row 8 onwards
            $row = 8;
            $no = 1;
            $totalUpahPokok = 0;
            $totalJkk = 0;
            $totalJkm = 0;
            $totalJht = 0;
            $totalPensiun = 0;
            $totalPremi = 0;

            foreach ($payrollDetails as $detail) {
                $employee = $detail->employee;

                // Get jk value from employee
                $jk = $employee->jenis_kelamin === 'laki-laki' ? 'L' : 'P';

                // Get tunjangan values from tunjangan_lain JSON
                $tunjanganData = json_decode($detail->tunjangan_lain, true) ?? [];

                // Get BPJS TK values (perusahaan + karyawan for each)
                // ID: 5=Pensiun, 6=JKM, 7=JKK, 8=JHT
                $jkk = ((float) ($tunjanganData['3']['perusahaan'] ?? 0)) + ((float) ($tunjanganData['3']['karyawan'] ?? 0));
                $jkm = ((float) ($tunjanganData['4']['perusahaan'] ?? 0)) + ((float) ($tunjanganData['4']['karyawan'] ?? 0));
                $jht = ((float) ($tunjanganData['2']['perusahaan'] ?? 0)) + ((float) ($tunjanganData['2']['karyawan'] ?? 0));
                $pensiun = ((float) ($tunjanganData['5']['perusahaan'] ?? 0)) + ((float) ($tunjanganData['5']['karyawan'] ?? 0));

                $totalPremiRow = $jkk + $jkm + $jht + $pensiun;

                $sheet->setCellValue('A' . $row, $no);
                $sheet->setCellValue('B' . $row, $employee->nip ?? '');
                $sheet->setCellValue('C' . $row, $employee->kjt ?? ''); // KPJ
                $sheet->setCellValue('D' . $row, $employee->nik ?? '');
                $sheet->setCellValue('E' . $row, $employee->nama ?? '');
                $sheet->setCellValue('F' . $row, $jk);
                $sheet->setCellValue('G' . $row, $employee->ptkp ?? 'TK/0');
                $sheet->setCellValue('H' . $row, $detail->gaji_pokok);
                $sheet->setCellValue('I' . $row, $jkk);
                $sheet->setCellValue('J' . $row, $jkm);
                $sheet->setCellValue('K' . $row, $jht);
                $sheet->setCellValue('L' . $row, $pensiun);
                $sheet->setCellValue('M' . $row, $totalPremiRow);

                // Style data row
                $sheet->getStyle('A' . $row . ':M' . $row)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
                $sheet->getStyle('A' . $row . ':F' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('G' . $row . ':M' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                // Number format
                $sheet->getStyle('H' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('I' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('J' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('K' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('L' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('M' . $row)->getNumberFormat()->setFormatCode('#,##0');

                $totalUpahPokok += (float) $detail->gaji_pokok;
                $totalJkk += $jkk;
                $totalJkm += $jkm;
                $totalJht += $jht;
                $totalPensiun += $pensiun;
                $totalPremi += $totalPremiRow;

                $no++;
                $row++;
            }

            // Total row
            $sheet->mergeCells('A' . $row . ':G' . $row);
            $sheet->setCellValue('A' . $row, 'JUMLAH :');
            $sheet->getStyle('A' . $row)->getFont()->setBold(true);
            $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            $sheet->setCellValue('H' . $row, $totalUpahPokok);
            $sheet->setCellValue('I' . $row, $totalJkk);
            $sheet->setCellValue('J' . $row, $totalJkm);
            $sheet->setCellValue('K' . $row, $totalJht);
            $sheet->setCellValue('L' . $row, $totalPensiun);
            $sheet->setCellValue('M' . $row, $totalPremi);

            $sheet->getStyle('A' . $row . ':M' . $row)->getFont()->setBold(true);
            $sheet->getStyle('A' . $row . ':M' . $row)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle('A' . $row . ':M' . $row)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F5F5DC');
            $sheet->getStyle('H' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('I' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('J' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('K' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('L' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('M' . $row)->getNumberFormat()->setFormatCode('#,##0');
        }

        if (!$hasData) {
            return redirect()->route('laporan.index', ['tahun' => $tahun])
                ->with('error', 'Tidak ada data payroll untuk cabang tersebut!');
        }

        // Output file
        $filename = 'BPJS_TK_' . $tahun . '_' . strtoupper($cabang->name) . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
        exit;
    }
}
