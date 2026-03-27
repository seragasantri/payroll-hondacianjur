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
use Illuminate\Support\Facades\Log;

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
            // Filter by bpjs_ketenagakerjaan = true for BPJS reports
            $payrollDetails = PayrollDetail::where('payroll_id', $payrollHeader->id)
                ->whereHas('employee', function ($query) use ($cabangId) {
                    $query->where('kantor_cabang_id', $cabangId)
                        ->where('bpjs_ketenagakerjaan', 1);
                })
                ->with(['employee' => function ($query) {
                    $query->withTrashed();
                }, 'employee.kantorCabang', 'employee.jabatan'])
                ->get();

            // Filter out employees with empty tunjangan_lain
            $payrollDetails = $payrollDetails->filter(function ($detail) {
                $tunjanganLain = $detail->tunjangan_lain;
                if (empty($tunjanganLain) || $tunjanganLain === '[]' || $tunjanganLain === 'null') {
                    return false;
                }
                return true;
            });

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
            // Filter by bpjs_ketenagakerjaan = true for BPJS reports
            $payrollDetails = PayrollDetail::where('payroll_id', $payrollHeader->id)
                ->whereHas('employee', function ($query) use ($cabangId) {
                    $query->where('kantor_cabang_id', $cabangId)
                        ->where('bpjs_ketenagakerjaan', 1);
                })
                ->with(['employee' => function ($query) {
                    $query->withTrashed();
                }, 'employee.kantorCabang', 'employee.jabatan'])
                ->get();

            // Filter out employees with empty tunjangan_lain
            $payrollDetails = $payrollDetails->filter(function ($detail) {
                $tunjanganLain = $detail->tunjangan_lain;
                if (empty($tunjanganLain) || $tunjanganLain === '[]' || $tunjanganLain === 'null') {
                    return false;
                }
                return true;
            });

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

    /**
     * Export PPH 21 to Excel with multiple sheets (one per month with data).
     */
    public function exportPph21($cabangId, $tahun, Request $request)
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
            // Filter by bpjs_ketenagakerjaan = true for BPJS reports
            $payrollDetails = PayrollDetail::where('payroll_id', $payrollHeader->id)
                ->whereHas('employee', function ($query) use ($cabangId) {
                    $query->where('kantor_cabang_id', $cabangId)
                        ->where('bpjs_ketenagakerjaan', 1);
                })
                ->with(['employee' => function ($query) {
                    $query->withTrashed();
                }, 'employee.kantorCabang', 'employee.jabatan'])
                ->get();

            // Filter out employees with empty tunjangan_lain
            $payrollDetails = $payrollDetails->filter(function ($detail) {
                $tunjanganLain = $detail->tunjangan_lain;
                if (empty($tunjanganLain) || $tunjanganLain === '[]' || $tunjanganLain === 'null') {
                    return false;
                }
                return true;
            });

            if ($payrollDetails->isEmpty()) {
                continue; // Skip months with no data
            }

            $hasData = true;

            // Create new sheet
            $sheet = $spreadsheet->createSheet();
            $sheet->setTitle($bulanName);

            // Set column widths
            $sheet->getColumnDimension('A')->setWidth(5);
            $sheet->getColumnDimension('B')->setWidth(10);
            $sheet->getColumnDimension('C')->setWidth(15);
            $sheet->getColumnDimension('D')->setWidth(15);
            $sheet->getColumnDimension('E')->setWidth(20);
            $sheet->getColumnDimension('F')->setWidth(25);
            $sheet->getColumnDimension('G')->setWidth(8);
            $sheet->getColumnDimension('H')->setWidth(15);
            $sheet->getColumnDimension('I')->setWidth(15);
            $sheet->getColumnDimension('J')->setWidth(15);
            $sheet->getColumnDimension('K')->setWidth(15);
            $sheet->getColumnDimension('L')->setWidth(15);
            $sheet->getColumnDimension('M')->setWidth(15);
            $sheet->getColumnDimension('N')->setWidth(15);

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
            $sheet->mergeCells('B2:N2');
            $sheet->setCellValue('B2', 'PUSAKA MOTOR UTAMA');
            $sheet->getStyle('B2')->getFont()->setSize(16)->setBold(true);
            $sheet->getStyle('B2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('B2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

            // Title - Row 3
            $sheet->mergeCells('B3:N3');
            $sheet->setCellValue('B3', 'LAPORAN PPH21 BULANAN');
            $sheet->getStyle('B3')->getFont()->setSize(14)->setBold(true);
            $sheet->getStyle('B3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Period - Row 4
            $sheet->mergeCells('B4:N4');
            $sheet->setCellValue('B4', 'PERIODE : ' . $bulanName . ' ' . $tahun);
            $sheet->getStyle('B4')->getFont()->setSize(12)->setBold(true);
            $sheet->getStyle('B4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Branch - Row 5
            $sheet->mergeCells('B5:N5');
            $sheet->setCellValue('B5', 'CABANG : ' . strtoupper($cabang->name));
            $sheet->getStyle('B5')->getFont()->setSize(12)->setBold(true);
            $sheet->getStyle('B5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Empty row
            $sheet->mergeCells('A6:N6');

            // Table Header - Row 7
            $headerRow = 7;
            $headers = ['NO', 'DIVISI', 'NIP', 'NO REK', 'NIK', 'NAMA PEGAWAI', 'STATUS', 'GAJI/UPAH', 'TUNJANGAN', 'ASTEK', 'INSENTIF/BONUS/THR', 'TOTAL DPP', 'PPH21', 'PPH TERHUTANG'];
            $column = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($column . $headerRow, $header);
                $column++;
            }

            // Style header
            $sheet->getStyle('A' . $headerRow . ':N' . $headerRow)->getFont()->setBold(true);
            $sheet->getStyle('A' . $headerRow . ':N' . $headerRow)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E0E0FF');
            $sheet->getStyle('A' . $headerRow . ':N' . $headerRow)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle('A' . $headerRow . ':N' . $headerRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Data rows
            $no = 1;
            $row = $headerRow + 1;

            $totalGaji = 0;
            $totalTunjangan = 0;
            $totalAstek = 0;
            $totalInsentif = 0;
            $totalDpp = 0;
            $totalPph21 = 0;

            foreach ($payrollDetails as $detail) {
                $employee = $detail->employee;

                // Parse tunjangan_lain JSON to get ASTEK (BPJS Kesehatan + JKK + JKM from perusahaan)
                $tunjanganData = json_decode($detail->tunjangan_lain, true) ?? [];
                $bpjsKesehatan = 0;
                $jkk = 0;
                $jkm = 0;

                // JSON keys: 1=BPJS Kesehatan, 2=JHT, 3=JKK, 4=JKM, 5=Pensiun
                // But json_decode with true returns indexed array, so we need to check keys
                $tunjanganAssoc = json_decode($detail->tunjangan_lain, true) ?? [];
                if (!empty($tunjanganAssoc)) {
                    // Check if it's keyed array or indexed
                    if (isset($tunjanganAssoc['1'])) {
                        // Keyed array - use the keys directly
                        $bpjsKesehatan = (float) ($tunjanganAssoc['1']['perusahaan'] ?? 0);
                        $jkk = (float) ($tunjanganAssoc['3']['perusahaan'] ?? 0);
                        $jkm = (float) ($tunjanganAssoc['4']['perusahaan'] ?? 0);
                    } else {
                        // Indexed array - use index 0, 2, 3
                        $bpjsKesehatan = (float) ($tunjanganAssoc[0]['perusahaan'] ?? 0);
                        $jkk = (float) ($tunjanganAssoc[2]['perusahaan'] ?? 0);
                        $jkm = (float) ($tunjanganAssoc[3]['perusahaan'] ?? 0);
                    }
                }

                $astek = $bpjsKesehatan + $jkk + $jkm;
                Log::info([
                    'employee_nip' => $employee->nip,
                    'employee_nama' => $employee->nama,
                    'astek' => $astek,
                    'bpjs_kes' => $bpjsKesehatan,
                    'jkk' => $jkk,
                    'jkm' => $jkm
                ]);

                // GAJI/UPAH = gaji_pokok - potongan_tidak_masuk - potongan_terlambat
                $gaji_upah = $detail->gaji_pokok - $detail->potongan_tidak_masuk - $detail->potongan_terlambat;

                // TUNJANGAN = tunjangan_jabatan + uang_hadir + lembur + lain_lain
                $tunjangan = $detail->tunjangan_jabatan + ($detail->uang_hadir ?? 0) + ($detail->lembur ?? 0) + ($detail->lain_lain ?? 0);

                // INSENTIF/BONUS/THR = insentif + lembur (already included in tunjangan, so just insentif here)
                $insentif = $detail->insentif ?? 0;

                // TOTAL DPP PPH21 = GAJI/UPAH + TUNJANGAN + ASTEK + INSENTIF/BONUS/THR
                $totalDppRow = $gaji_upah + $tunjangan + $astek + $insentif;

                // PPH21 = pph21_amount
                $pph21 = $detail->pph21_amount ?? 0;

                // Write data
                $sheet->setCellValue('A' . $row, $no);
                $sheet->setCellValue('B' . $row, $employee->kantorCabang?->name ?? '-');
                $sheet->setCellValue('C' . $row, $employee->nip);
                $sheet->setCellValue('D' . $row, $employee->nomor_rekening ?? '-');
                $sheet->setCellValue('E' . $row, $employee->nik ?? '-');
                $sheet->setCellValue('F' . $row, $employee->nama);
                $sheet->setCellValue('G' . $row, $employee->ptkp ?? '-');
                $sheet->setCellValue('H' . $row, $gaji_upah);
                $sheet->setCellValue('I' . $row, $tunjangan);
                $sheet->setCellValue('J' . $row, $astek);
                $sheet->setCellValue('K' . $row, $insentif);
                $sheet->setCellValue('L' . $row, $totalDppRow);
                $sheet->setCellValue('M' . $row, $pph21);
                $sheet->setCellValue('N' . $row, $pph21);

                // Style data row
                $sheet->getStyle('A' . $row . ':N' . $row)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
                $sheet->getStyle('A' . $row . ':G' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('H' . $row . ':N' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                // Number format
                $sheet->getStyle('H' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('I' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('J' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('K' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('L' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('M' . $row)->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('N' . $row)->getNumberFormat()->setFormatCode('#,##0');

                $totalGaji += $gaji_upah;
                $totalTunjangan += $tunjangan;
                $totalAstek += $astek;
                $totalInsentif += $insentif;
                $totalDpp += $totalDppRow;
                $totalPph21 += $pph21;

                $no++;
                $row++;
            }

            // Total row
            $sheet->mergeCells('A' . $row . ':G' . $row);
            $sheet->setCellValue('A' . $row, 'JUMLAH :');
            $sheet->getStyle('A' . $row)->getFont()->setBold(true);
            $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            $sheet->setCellValue('H' . $row, $totalGaji);
            $sheet->setCellValue('I' . $row, $totalTunjangan);
            $sheet->setCellValue('J' . $row, $totalAstek);
            $sheet->setCellValue('K' . $row, $totalInsentif);
            $sheet->setCellValue('L' . $row, $totalDpp);
            $sheet->setCellValue('M' . $row, $totalPph21);
            $sheet->setCellValue('N' . $row, $totalPph21);

            $sheet->getStyle('A' . $row . ':N' . $row)->getFont()->setBold(true);
            $sheet->getStyle('A' . $row . ':N' . $row)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle('A' . $row . ':N' . $row)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F5F5DC');
            $sheet->getStyle('H' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('I' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('J' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('K' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('L' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('M' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('N' . $row)->getNumberFormat()->setFormatCode('#,##0');
        }

        if (!$hasData) {
            return redirect()->route('laporan.index', ['tahun' => $tahun])
                ->with('error', 'Tidak ada data payroll untuk cabang tersebut!');
        }

        // Output file
        $filename = 'PPH21_' . $tahun . '_' . strtoupper($cabang->name) . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
        exit;
    }

    /**
     * Export PPH 21 Tahunan to Excel.
     */
    public function exportPph21Tahunan($cabangId, $tahun, Request $request)
    {
        // Get kantor cabang
        $cabang = KantorCabang::findOrFail($cabangId);

        // Get all published payrolls for the selected year (January to December + THR)
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

        // PTKP values
        $ptkpValues = [
            'TK/0' => 54000000,
            'TK/1' => 58500000,
            'TK/2' => 63000000,
            'TK/3' => 67500000,
            'K/0' => 58500000,
            'K/1' => 63000000,
            'K/2' => 67500000,
            'K/3' => 72000000,
        ];

        // Get all payroll details for this cabang grouped by employee
        $employeeData = [];

        foreach ($payrollHeaders as $payrollHeader) {
            $bulan = $payrollHeader->bulan;

            // Get payroll details
            $payrollDetails = PayrollDetail::where('payroll_id', $payrollHeader->id)
                ->whereHas('employee', function ($query) use ($cabangId) {
                    $query->where('kantor_cabang_id', $cabangId);
                })
                ->with(['employee' => function ($query) {
                    $query->withTrashed();
                }, 'employee.kantorCabang', 'employee.jabatan'])
                ->get();

            foreach ($payrollDetails as $detail) {
                $employee = $detail->employee;
                $employeeId = $employee->id;

                if (!isset($employeeData[$employeeId])) {
                    $employeeData[$employeeId] = [
                        'employee' => $employee,
                        'gaji_setahun' => 0,
                        'tunjangan_setahun' => 0,
                        'astek_setahun' => 0,
                        'insentif_setahun' => 0,
                        'pph21_dibayar' => 0,
                        'jht_karyawan' => 0,
                        'pensiun_karyawan' => 0,
                        'bulan_list' => [],
                    ];
                }

                // Parse tunjangan_lain
                $tunjanganData = json_decode($detail->tunjangan_lain, true) ?? [];
                $bpjsKesehatan = 0;
                $jkk = 0;
                $jkm = 0;
                $jht = 0;
                $pensiun = 0;

                if (!empty($tunjanganData)) {
                    if (isset($tunjanganData['1'])) {
                        $bpjsKesehatan = (float) ($tunjanganData['1']['perusahaan'] ?? 0);
                    } elseif (isset($tunjanganData[0])) {
                        $bpjsKesehatan = (float) ($tunjanganData[0]['perusahaan'] ?? 0);
                    }

                    if (isset($tunjanganData['3'])) {
                        $jkk = (float) ($tunjanganData['3']['perusahaan'] ?? 0);
                    } elseif (isset($tunjanganData[2])) {
                        $jkk = (float) ($tunjanganData[2]['perusahaan'] ?? 0);
                    }

                    if (isset($tunjanganData['4'])) {
                        $jkm = (float) ($tunjanganData['4']['perusahaan'] ?? 0);
                    } elseif (isset($tunjanganData[3])) {
                        $jkm = (float) ($tunjanganData[3]['perusahaan'] ?? 0);
                    }

                    // JHT and Pensiun - bagian karyawan
                    if (isset($tunjanganData['2'])) {
                        $jht = (float) ($tunjanganData['2']['karyawan'] ?? 0);
                    } elseif (isset($tunjanganData[1])) {
                        $jht = (float) ($tunjanganData[1]['karyawan'] ?? 0);
                    }

                    if (isset($tunjanganData['5'])) {
                        $pensiun = (float) ($tunjanganData['5']['karyawan'] ?? 0);
                    } elseif (isset($tunjanganData[4])) {
                        $pensiun = (float) ($tunjanganData[4]['karyawan'] ?? 0);
                    }
                }

                $astek = $bpjsKesehatan + $jkk + $jkm;

                // GAJI/UPAH = gaji_pokok - potongan_tidak_masuk - potongan_terlambat
                $gaji_upah = $detail->gaji_pokok - $detail->potongan_tidak_masuk - $detail->potongan_terlambat;

                // TUNJANGAN = tunjangan_jabatan + uang_hadir + lembur + lain_lain
                $tunjangan = $detail->tunjangan_jabatan + ($detail->uang_hadir ?? 0) + ($detail->lembur ?? 0) + ($detail->lain_lain ?? 0);

                // INSENTIF = insentif
                $insentif = $detail->insentif ?? 0;

                // Add to employee totals
                $employeeData[$employeeId]['gaji_setahun'] += $gaji_upah;
                $employeeData[$employeeId]['tunjangan_setahun'] += $tunjangan;
                $employeeData[$employeeId]['astek_setahun'] += $astek;
                $employeeData[$employeeId]['insentif_setahun'] += $insentif;
                $employeeData[$employeeId]['pph21_dibayar'] += ($detail->pph21_amount ?? 0);
                $employeeData[$employeeId]['jht_karyawan'] += $jht;
                $employeeData[$employeeId]['pensiun_karyawan'] += $pensiun;

                // Track bulan
                if (str_starts_with($bulan, 'THR')) {
                    $employeeData[$employeeId]['bulan_list'][] = 'THR';
                } else {
                    $bulanNum = (int) substr($bulan, 5, 2);
                    $employeeData[$employeeId]['bulan_list'][] = $bulanNum;
                }
            }
        }

        if (empty($employeeData)) {
            return redirect()->route('laporan.index', ['tahun' => $tahun])
                ->with('error', 'Tidak ada data payroll untuk cabang tersebut!');
        }

        // Create Excel
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('PPH21 Tahunan');

        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(10);
        $sheet->getColumnDimension('C')->setWidth(15);
        $sheet->getColumnDimension('D')->setWidth(12);
        $sheet->getColumnDimension('E')->setWidth(18);
        $sheet->getColumnDimension('F')->setWidth(25);
        $sheet->getColumnDimension('G')->setWidth(8);
        $sheet->getColumnDimension('H')->setWidth(8);
        $sheet->getColumnDimension('I')->setWidth(8);
        $sheet->getColumnDimension('J')->setWidth(15);
        $sheet->getColumnDimension('K')->setWidth(15);
        $sheet->getColumnDimension('L')->setWidth(15);
        $sheet->getColumnDimension('M')->setWidth(15);
        $sheet->getColumnDimension('N')->setWidth(15);
        $sheet->getColumnDimension('O')->setWidth(15);
        $sheet->getColumnDimension('P')->setWidth(15);
        $sheet->getColumnDimension('Q')->setWidth(20);
        $sheet->getColumnDimension('R')->setWidth(20);
        $sheet->getColumnDimension('S')->setWidth(18);

        // Set row heights for header area
        $sheet->getRowDimension(1)->setRowHeight(80);
        $sheet->getRowDimension(2)->setRowHeight(30);
        $sheet->getRowDimension(3)->setRowHeight(25);
        $sheet->getRowDimension(4)->setRowHeight(25);

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
        $sheet->mergeCells('B2:S2');
        $sheet->setCellValue('B2', 'PUSAKA MOTOR UTAMA');
        $sheet->getStyle('B2')->getFont()->setSize(16)->setBold(true);
        $sheet->getStyle('B2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
        $sheet->getStyle('B2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        // Title - Row 3
        $sheet->mergeCells('B3:S3');
        $sheet->setCellValue('B3', 'LAPORAN PPH21 TAHUNAN');
        $sheet->getStyle('B3')->getFont()->setSize(14)->setBold(true);
        $sheet->getStyle('B3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        // Period - Row 4
        $sheet->mergeCells('B4:S4');
        $sheet->setCellValue('B4', 'TAHUN : ' . $tahun);
        $sheet->getStyle('B4')->getFont()->setSize(12)->setBold(true);
        $sheet->getStyle('B4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        // Branch - Row 5
        $sheet->mergeCells('B5:S5');
        $sheet->setCellValue('B5', 'CABANG : ' . strtoupper($cabang->name));
        $sheet->getStyle('B5')->getFont()->setSize(12)->setBold(true);
        $sheet->getStyle('B5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        // Empty row
        $sheet->mergeCells('A6:S6');

        // Table Header - Row 7
        $headerRow = 7;
        $headers = [
            'NO',
            'DIVISI',
            'NIP',
            'NO REK',
            'NIK',
            'NAMA PEGAWAI',
            'STATUS',
            'MASA KERJA',
            '',
            'GAJI/UPAH SETAHUN',
            'TUNJANGAN SETAHUN',
            'ASTEK SETAHUN',
            'INSENTIF/BONUS/THR',
            'TOTAL',
            'BIAYA JABATAN',
            'IURAN JHT & PENSIUN (K)',
            'PTKP',
            'PENHASILAN KENA PAJAK SETAHUN',
            'PAJAK TERHUTANG SETAHUN',
            'PAJAK SUDAH DIBAYAR',
            'PAJAK TERHUTANG DES'
        ];

        $column = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($column . $headerRow, $header);
            $column++;
        }

        // Style header
        $sheet->getStyle('A' . $headerRow . ':S' . $headerRow)->getFont()->setBold(true);
        $sheet->getStyle('A' . $headerRow . ':S' . $headerRow)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E0E0FF');
        $sheet->getStyle('A' . $headerRow . ':S' . $headerRow)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle('A' . $headerRow . ':S' . $headerRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Merge Masa Kerja header
        $sheet->mergeCells('H' . $headerRow . ':I' . $headerRow);

        // Data rows
        $no = 1;
        $row = $headerRow + 1;

        $totalGaji = 0;
        $totalTunjangan = 0;
        $totalAstek = 0;
        $totalInsentif = 0;
        $totalSemua = 0;
        $totalBiayaJabatan = 0;
        $totalIuran = 0;
        $totalPkp = 0;
        $totalPajakTerhutang = 0;
        $totalPajakDibayar = 0;
        $totalPajakDes = 0;

        foreach ($employeeData as $data) {
            $employee = $data['employee'];
            $bulanList = $data['bulan_list'];

            // Calculate masa kerja
            $bulanListSorted = array_unique($bulanList);
            sort($bulanListSorted);
            $bulanAwal = !empty($bulanListSorted) ? min($bulanListSorted) : 1;
            $bulanAkhir = !empty($bulanListSorted) ? max($bulanListSorted) : 12;
            if ($bulanAkhir === 'THR') {
                $bulanAkhir = 12;
            }

            $gajiSetahun = $data['gaji_setahun'];
            $tunjanganSetahun = $data['tunjangan_setahun'];
            $astekSetahun = $data['astek_setahun'];
            $insentifSetahun = $data['insentif_setahun'];
            $total = $gajiSetahun + $tunjanganSetahun + $astekSetahun + $insentifSetahun;
            $biayaJabatan = $total * 0.05;
            $iuranJhtPensiun = $data['jht_karyawan'] + $data['pensiun_karyawan'];

            // PTKP
            $ptkpKode = $employee->ptkp ?? 'TK/0';
            $ptkpNilai = $ptkpValues[$ptkpKode] ?? 54000000;

            // Penghasilan Kena Pajak Setahun
            $pkp = $ptkpNilai - $total - $biayaJabatan + $iuranJhtPensiun;
            if ($pkp < 0) {
                $pkp = 0;
            }

            // Pajak Terhutang Setahun (Tarif Pasal 17)
            $pajakTerhutang = $this->calculatePph21Annual($pkp);

            // Pajak Sudah Dibayar
            $pajakDibayar = $data['pph21_dibayar'];

            // Pajak Terhutang DES
            $pajakDes = $pajakTerhutang - $pajakDibayar;

            // Write data
            $sheet->setCellValue('A' . $row, $no);
            $sheet->setCellValue('B' . $row, $employee->kantorCabang?->name ?? '-');
            $sheet->setCellValue('C' . $row, $employee->nip);
            $sheet->setCellValue('D' . $row, $employee->nomor_rekening ?? '-');
            $sheet->setCellValue('E' . $row, $employee->nik ?? '-');
            $sheet->setCellValue('F' . $row, $employee->nama);
            $sheet->setCellValue('G' . $row, $ptkpKode);
            $sheet->setCellValue('H' . $row, str_pad($bulanAwal, 2, '0', STR_PAD_LEFT));
            $sheet->setCellValue('I' . $row, str_pad($bulanAkhir, 2, '0', STR_PAD_LEFT));
            $sheet->setCellValue('J' . $row, $gajiSetahun);
            $sheet->setCellValue('K' . $row, $tunjanganSetahun);
            $sheet->setCellValue('L' . $row, $astekSetahun);
            $sheet->setCellValue('M' . $row, $insentifSetahun);
            $sheet->setCellValue('N' . $row, $total);
            $sheet->setCellValue('O' . $row, $biayaJabatan);
            $sheet->setCellValue('P' . $row, $iuranJhtPensiun);
            $sheet->setCellValue('Q' . $row, $ptkpNilai);
            $sheet->setCellValue('R' . $row, $pkp);
            $sheet->setCellValue('S' . $row, $pajakTerhutang);
            $sheet->setCellValue('T' . $row, $pajakDibayar);
            $sheet->setCellValue('U' . $row, $pajakDes);

            // Style data row
            $sheet->getStyle('A' . $row . ':U' . $row)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle('A' . $row . ':G' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('H' . $row . ':U' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            // Number format
            $sheet->getStyle('J' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('K' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('L' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('M' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('N' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('O' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('P' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('Q' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('R' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('S' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('T' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('U' . $row)->getNumberFormat()->setFormatCode('#,##0');

            // Totals
            $totalGaji += $gajiSetahun;
            $totalTunjangan += $tunjanganSetahun;
            $totalAstek += $astekSetahun;
            $totalInsentif += $insentifSetahun;
            $totalSemua += $total;
            $totalBiayaJabatan += $biayaJabatan;
            $totalIuran += $iuranJhtPensiun;
            $totalPkp += $pkp;
            $totalPajakTerhutang += $pajakTerhutang;
            $totalPajakDibayar += $pajakDibayar;
            $totalPajakDes += $pajakDes;

            $no++;
            $row++;
        }

        // Total row
        $sheet->mergeCells('A' . $row . ':I' . $row);
        $sheet->setCellValue('A' . $row, 'JUMLAH :');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        $sheet->setCellValue('J' . $row, $totalGaji);
        $sheet->setCellValue('K' . $row, $totalTunjangan);
        $sheet->setCellValue('L' . $row, $totalAstek);
        $sheet->setCellValue('M' . $row, $totalInsentif);
        $sheet->setCellValue('N' . $row, $totalSemua);
        $sheet->setCellValue('O' . $row, $totalBiayaJabatan);
        $sheet->setCellValue('P' . $row, $totalIuran);
        $sheet->setCellValue('Q' . $row, '');
        $sheet->setCellValue('R' . $row, $totalPkp);
        $sheet->setCellValue('S' . $row, $totalPajakTerhutang);
        $sheet->setCellValue('T' . $row, $totalPajakDibayar);
        $sheet->setCellValue('U' . $row, $totalPajakDes);

        $sheet->getStyle('A' . $row . ':U' . $row)->getFont()->setBold(true);
        $sheet->getStyle('A' . $row . ':U' . $row)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle('A' . $row . ':U' . $row)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F5F5DC');

        foreach (range('J', 'U') as $col) {
            $sheet->getStyle($col . $row)->getNumberFormat()->setFormatCode('#,##0');
        }

        // Output file
        $filename = 'PPH21_Tahunan_' . $tahun . '_' . strtoupper($cabang->name) . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
        exit;
    }

    /**
     * Calculate PPH 21 Annual Tax using Pasal 17 tariff
     */
    private function calculatePph21Annual($pkp)
    {
        if ($pkp <= 0) {
            return 0;
        }

        // Tarif Pasal 17 ayat 1
        if ($pkp <= 60000000) {
            return $pkp * 0.05;
        } elseif ($pkp <= 250000000) {
            return 3000000 + ($pkp - 60000000) * 0.10;
        } elseif ($pkp <= 500000000) {
            return 3000000 + 19000000 + ($pkp - 250000000) * 0.15;
        } elseif ($pkp <= 5000000000) {
            return 3000000 + 19000000 + 37500000 + ($pkp - 500000000) * 0.25;
        } else {
            return 3000000 + 19000000 + 37500000 + 1125000000 + ($pkp - 5000000000) * 0.30;
        }
    }

    /**
     * Export Penggajian to Excel with multiple sheets (one per month with data).
     */
    public function exportPenggajian($cabangId, $tahun, Request $request)
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
                continue;
            }

            $hasData = true;

            // Create new sheet
            $sheet = $spreadsheet->createSheet();
            $sheet->setTitle($bulanName);

            // Set column widths
            $sheet->getColumnDimension('A')->setWidth(5);
            $sheet->getColumnDimension('B')->setWidth(12);
            $sheet->getColumnDimension('C')->setWidth(15);
            $sheet->getColumnDimension('D')->setWidth(12);
            $sheet->getColumnDimension('E')->setWidth(18);
            $sheet->getColumnDimension('F')->setWidth(25);
            $sheet->getColumnDimension('G')->setWidth(8);
            // PENERIMAAN columns
            $sheet->getColumnDimension('H')->setWidth(12);
            $sheet->getColumnDimension('I')->setWidth(12);
            $sheet->getColumnDimension('J')->setWidth(12);
            $sheet->getColumnDimension('K')->setWidth(12);
            $sheet->getColumnDimension('L')->setWidth(10);
            $sheet->getColumnDimension('M')->setWidth(10);
            $sheet->getColumnDimension('N')->setWidth(12);
            // POTONGAN columns
            $sheet->getColumnDimension('O')->setWidth(12);
            $sheet->getColumnDimension('P')->setWidth(10);
            $sheet->getColumnDimension('Q')->setWidth(10);
            $sheet->getColumnDimension('R')->setWidth(10);
            $sheet->getColumnDimension('S')->setWidth(12);
            $sheet->getColumnDimension('T')->setWidth(12);
            $sheet->getColumnDimension('U')->setWidth(12);
            $sheet->getColumnDimension('V')->setWidth(12);
            $sheet->getColumnDimension('W')->setWidth(12);
            $sheet->getColumnDimension('X')->setWidth(12);
            $sheet->getColumnDimension('Y')->setWidth(10);
            $sheet->getColumnDimension('Z')->setWidth(10);
            $sheet->getColumnDimension('AA')->setWidth(12);
            // NETTO
            $sheet->getColumnDimension('AB')->setWidth(15);

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

            // Company Name - Row 2
            $sheet->mergeCells('B2:AB2');
            $sheet->setCellValue('B2', 'PUSAKA MOTOR UTAMA');
            $sheet->getStyle('B2')->getFont()->setSize(16)->setBold(true);
            $sheet->getStyle('B2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('B2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

            // Title - Row 3
            $sheet->mergeCells('B3:AB3');
            $sheet->setCellValue('B3', 'LAPORAN PENGGAJIAN');
            $sheet->getStyle('B3')->getFont()->setSize(14)->setBold(true);
            $sheet->getStyle('B3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Period - Row 4
            $sheet->mergeCells('B4:AB4');
            $sheet->setCellValue('B4', 'PERIODE : ' . $bulanName . ' ' . $tahun);
            $sheet->getStyle('B4')->getFont()->setSize(12)->setBold(true);
            $sheet->getStyle('B4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Branch - Row 5
            $sheet->mergeCells('B5:AB5');
            $sheet->setCellValue('B5', 'CABANG : ' . strtoupper($cabang->name));
            $sheet->getStyle('B5')->getFont()->setSize(12)->setBold(true);
            $sheet->getStyle('B5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Empty row
            $sheet->mergeCells('A6:AB6');

            // Table Header - Row 7
            $headerRow = 7;

            // Main headers
            $sheet->setCellValue('A' . $headerRow, 'NO');
            $sheet->setCellValue('B' . $headerRow, 'JABATAN');
            $sheet->setCellValue('C' . $headerRow, 'NIP');
            $sheet->setCellValue('D' . $headerRow, 'NO REK');
            $sheet->setCellValue('E' . $headerRow, 'NIK');
            $sheet->setCellValue('F' . $headerRow, 'NAMA PEGAWAI');
            $sheet->setCellValue('G' . $headerRow, 'STATUS');

            // PENERIMAAN header
            $sheet->setCellValue('H' . $headerRow, 'GAJI POKOK');
            $sheet->setCellValue('I' . $headerRow, 'TUNJANGAN');
            $sheet->setCellValue('J' . $headerRow, 'INSENTIF');
            $sheet->setCellValue('K' . $headerRow, 'REWARD');
            $sheet->setCellValue('L' . $headerRow, 'U HADIR');
            $sheet->setCellValue('M' . $headerRow, 'LEMBUR');
            $sheet->setCellValue('N' . $headerRow, 'LAIN-LAIN');
            $sheet->setCellValue('O' . $headerRow, 'JUMLAH PENERIMAAN');

            // POTONGAN header
            $sheet->setCellValue('P' . $headerRow, 'BPJS KES');
            $sheet->setCellValue('Q' . $headerRow, 'JKK');
            $sheet->setCellValue('R' . $headerRow, 'JKM');
            $sheet->setCellValue('S' . $headerRow, 'JHT');
            $sheet->setCellValue('T' . $headerRow, 'PENSIUN');
            $sheet->setCellValue('U' . $headerRow, 'SUBTOTAL');
            $sheet->setCellValue('V' . $headerRow, 'BPJS TK (P)');
            $sheet->setCellValue('W' . $headerRow, 'BPJS TK (K)');
            $sheet->setCellValue('X' . $headerRow, 'JPK');
            $sheet->setCellValue('Y' . $headerRow, 'PPH21');
            $sheet->setCellValue('Z' . $headerRow, 'PINJAMAN');
            $sheet->setCellValue('AA' . $headerRow, 'ABSEN');
            $sheet->setCellValue('AB' . $headerRow, 'JUMLAH POTONGAN');

            // NETTO header
            $sheet->setCellValue('AC' . $headerRow, 'NETTO');

            // Style header
            $sheet->getStyle('A' . $headerRow . ':AC' . $headerRow)->getFont()->setBold(true);
            $sheet->getStyle('A' . $headerRow . ':AC' . $headerRow)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E0E0FF');
            $sheet->getStyle('A' . $headerRow . ':AC' . $headerRow)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle('A' . $headerRow . ':AC' . $headerRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('A' . $headerRow . ':AC' . $headerRow)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

            // Data rows
            $no = 1;
            $row = $headerRow + 1;

            $totalGajiPokok = 0;
            $totalTunjangan = 0;
            $totalInsentif = 0;
            $totalReward = 0;
            $totalUHadir = 0;
            $totalLembur = 0;
            $totalLain = 0;
            $totalPenerimaan = 0;

            $totalBpjsKes = 0;
            $totalJkk = 0;
            $totalJkm = 0;
            $totalJht = 0;
            $totalPensiun = 0;
            $totalSubtotalPot = 0;
            $totalBpjsTkP = 0;
            $totalBpjsTkK = 0;
            $totalJpk = 0;
            $totalPph21 = 0;
            $totalPinjaman = 0;
            $totalAbsen = 0;
            $totalPotongan = 0;
            $totalNetto = 0;

            foreach ($payrollDetails as $detail) {
                $employee = $detail->employee;

                // Parse tunjangan_lain JSON
                $tunjanganData = json_decode($detail->tunjangan_lain, true) ?? [];

                // Defaults
                $bpjsKesPer = 0;
                $bpjsKesKar = 0;
                $jkkPer = 0;
                $jkmPer = 0;
                $jhtPer = 0;
                $jhtKar = 0;
                $pensiunPer = 0;
                $pensiunKar = 0;

                if (!empty($tunjanganData)) {
                    if (isset($tunjanganData['1'])) {
                        $bpjsKesPer = (float) ($tunjanganData['1']['perusahaan'] ?? 0);
                        $bpjsKesKar = (float) ($tunjanganData['1']['karyawan'] ?? 0);
                    } elseif (isset($tunjanganData[0])) {
                        $bpjsKesPer = (float) ($tunjanganData[0]['perusahaan'] ?? 0);
                        $bpjsKesKar = (float) ($tunjanganData[0]['karyawan'] ?? 0);
                    }

                    if (isset($tunjanganData['3'])) {
                        $jkkPer = (float) ($tunjanganData['3']['perusahaan'] ?? 0);
                    } elseif (isset($tunjanganData[2])) {
                        $jkkPer = (float) ($tunjanganData[2]['perusahaan'] ?? 0);
                    }

                    if (isset($tunjanganData['4'])) {
                        $jkmPer = (float) ($tunjanganData['4']['perusahaan'] ?? 0);
                    } elseif (isset($tunjanganData[3])) {
                        $jkmPer = (float) ($tunjanganData[3]['perusahaan'] ?? 0);
                    }

                    if (isset($tunjanganData['2'])) {
                        $jhtPer = (float) ($tunjanganData['2']['perusahaan'] ?? 0);
                        $jhtKar = (float) ($tunjanganData['2']['karyawan'] ?? 0);
                    } elseif (isset($tunjanganData[1])) {
                        $jhtPer = (float) ($tunjanganData[1]['perusahaan'] ?? 0);
                        $jhtKar = (float) ($tunjanganData[1]['karyawan'] ?? 0);
                    }

                    if (isset($tunjanganData['5'])) {
                        $pensiunPer = (float) ($tunjanganData['5']['perusahaan'] ?? 0);
                        $pensiunKar = (float) ($tunjanganData['5']['karyawan'] ?? 0);
                    } elseif (isset($tunjanganData[4])) {
                        $pensiunPer = (float) ($tunjanganData[4]['perusahaan'] ?? 0);
                        $pensiunKar = (float) ($tunjanganData[4]['karyawan'] ?? 0);
                    }
                }

                // Calculate values
                $gajiPokok = $detail->gaji_pokok;
                $tunjangan = $detail->tunjangan_jabatan;
                $insentif = $detail->insentif ?? 0;
                $reward = $detail->reward ?? 0;
                $uHadhir = $detail->uang_hadir ?? 0;
                $lembur = $detail->lembur ?? 0;
                $lainLain = $detail->lain_lain ?? 0;

                $jumlahPenerimaan = $gajiPokok + $tunjangan + $insentif + $reward + $uHadhir + $lembur + $lainLain;

                // Potongan perusahaan
                $subtotalPotPer = $bpjsKesPer + $jkkPer + $jkmPer + $jhtPer + $pensiunPer;

                // Potongan karyawan
                $bpjsTkP = $bpjsKesKar; // BPJS Kesehatan karyawan
                $bpjsTkK = $jhtKar + $pensiunKar; // JHT + Pensiun karyawan
                $jpk = 0; // Assuming JPK is part of something, let me know if needed
                $pph21 = $detail->pph21_amount ?? 0;
                $pinjaman = $detail->kasbon ?? 0;
                $absen = $detail->potongan_tidak_masuk + $detail->potongan_terlambat;

                $jumlahPotongan = $subtotalPotPer + $bpjsTkP + $bpjsTkK + $jpk + $pph21 + $pinjaman + $absen;
                $netto = $jumlahPenerimaan - $jumlahPotongan;

                // Write data
                $sheet->setCellValue('A' . $row, $no);
                $sheet->setCellValue('B' . $row, $employee->jabatan?->name ?? '-');
                $sheet->setCellValue('C' . $row, $employee->nip);
                $sheet->setCellValue('D' . $row, $employee->nomor_rekening ?? '-');
                $sheet->setCellValue('E' . $row, $employee->nik ?? '-');
                $sheet->setCellValue('F' . $row, $employee->nama);
                $sheet->setCellValue('G' . $row, $employee->ptkp ?? '-');

                // PENERIMAAN
                $sheet->setCellValue('H' . $row, $gajiPokok);
                $sheet->setCellValue('I' . $row, $tunjangan);
                $sheet->setCellValue('J' . $row, $insentif);
                $sheet->setCellValue('K' . $row, $reward);
                $sheet->setCellValue('L' . $row, $uHadhir);
                $sheet->setCellValue('M' . $row, $lembur);
                $sheet->setCellValue('N' . $row, $lainLain);
                $sheet->setCellValue('O' . $row, $jumlahPenerimaan);

                // POTONGAN
                $sheet->setCellValue('P' . $row, $bpjsKesPer);
                $sheet->setCellValue('Q' . $row, $jkkPer);
                $sheet->setCellValue('R' . $row, $jkmPer);
                $sheet->setCellValue('S' . $row, $jhtPer);
                $sheet->setCellValue('T' . $row, $pensiunPer);
                $sheet->setCellValue('U' . $row, $subtotalPotPer);
                $sheet->setCellValue('V' . $row, $bpjsTkP);
                $sheet->setCellValue('W' . $row, $bpjsTkK);
                $sheet->setCellValue('X' . $row, $jpk);
                $sheet->setCellValue('Y' . $row, $pph21);
                $sheet->setCellValue('Z' . $row, $pinjaman);
                $sheet->setCellValue('AA' . $row, $absen);
                $sheet->setCellValue('AB' . $row, $jumlahPotongan);

                // NETTO
                $sheet->setCellValue('AC' . $row, $netto);

                // Style data row
                $sheet->getStyle('A' . $row . ':AC' . $row)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
                $sheet->getStyle('A' . $row . ':G' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('H' . $row . ':AC' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                // Number format
                $numberColumns = ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC'];
                foreach ($numberColumns as $col) {
                    $sheet->getStyle($col . $row)->getNumberFormat()->setFormatCode('#,##0');
                }

                // Totals
                $totalGajiPokok += $gajiPokok;
                $totalTunjangan += $tunjangan;
                $totalInsentif += $insentif;
                $totalReward += $reward;
                $totalUHadir += $uHadhir;
                $totalLembur += $lembur;
                $totalLain += $lainLain;
                $totalPenerimaan += $jumlahPenerimaan;

                $totalBpjsKes += $bpjsKesPer;
                $totalJkk += $jkkPer;
                $totalJkm += $jkmPer;
                $totalJht += $jhtPer;
                $totalPensiun += $pensiunPer;
                $totalSubtotalPot += $subtotalPotPer;
                $totalBpjsTkP += $bpjsTkP;
                $totalBpjsTkK += $bpjsTkK;
                $totalJpk += $jpk;
                $totalPph21 += $pph21;
                $totalPinjaman += $pinjaman;
                $totalAbsen += $absen;
                $totalPotongan += $jumlahPotongan;
                $totalNetto += $netto;

                $no++;
                $row++;
            }

            // Total row
            $sheet->mergeCells('A' . $row . ':G' . $row);
            $sheet->setCellValue('A' . $row, 'JUMLAH :');
            $sheet->getStyle('A' . $row)->getFont()->setBold(true);
            $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            $sheet->setCellValue('H' . $row, $totalGajiPokok);
            $sheet->setCellValue('I' . $row, $totalTunjangan);
            $sheet->setCellValue('J' . $row, $totalInsentif);
            $sheet->setCellValue('K' . $row, $totalReward);
            $sheet->setCellValue('L' . $row, $totalUHadir);
            $sheet->setCellValue('M' . $row, $totalLembur);
            $sheet->setCellValue('N' . $row, $totalLain);
            $sheet->setCellValue('O' . $row, $totalPenerimaan);

            $sheet->setCellValue('P' . $row, $totalBpjsKes);
            $sheet->setCellValue('Q' . $row, $totalJkk);
            $sheet->setCellValue('R' . $row, $totalJkm);
            $sheet->setCellValue('S' . $row, $totalJht);
            $sheet->setCellValue('T' . $row, $totalPensiun);
            $sheet->setCellValue('U' . $row, $totalSubtotalPot);
            $sheet->setCellValue('V' . $row, $totalBpjsTkP);
            $sheet->setCellValue('W' . $row, $totalBpjsTkK);
            $sheet->setCellValue('X' . $row, $totalJpk);
            $sheet->setCellValue('Y' . $row, $totalPph21);
            $sheet->setCellValue('Z' . $row, $totalPinjaman);
            $sheet->setCellValue('AA' . $row, $totalAbsen);
            $sheet->setCellValue('AB' . $row, $totalPotongan);
            $sheet->setCellValue('AC' . $row, $totalNetto);

            $sheet->getStyle('A' . $row . ':AC' . $row)->getFont()->setBold(true);
            $sheet->getStyle('A' . $row . ':AC' . $row)->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle('A' . $row . ':AC' . $row)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F5F5DC');

            $numberColumns = ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC'];
            foreach ($numberColumns as $col) {
                $sheet->getStyle($col . $row)->getNumberFormat()->setFormatCode('#,##0');
            }
        }

        if (!$hasData) {
            return redirect()->route('laporan.index', ['tahun' => $tahun])
                ->with('error', 'Tidak ada data payroll untuk cabang tersebut!');
        }

        // Output file
        $filename = 'Penggajian_' . $tahun . '_' . strtoupper($cabang->name) . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
        exit;
    }
}
