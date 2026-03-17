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

        // Get all published payrolls for the selected year and cabang
        $payrollHeaders = Payrolls::where('bulan', 'like', $tahun . '-%')
            ->where('status', 'published')
            ->orderBy('bulan', 'asc')
            ->get();

        if ($payrollHeaders->isEmpty()) {
            return redirect()->route('laporan.index')
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
            $bulanDate = \Carbon\Carbon::parse($bulan . '-01');
            $month = $bulanDate->format('m');
            $bulanName = $bulanIndo[$month] ?? strtoupper($month);

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

                // BPJS Kesehatan id = 9
                $bpjsPerusahaan = isset($tunjanganData['9']['perusahaan']) ? (float) $tunjanganData['9']['perusahaan'] : 0;
                $bpjsKaryawan = isset($tunjanganData['9']['karyawan']) ? (float) $tunjanganData['9']['karyawan'] : 0;
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
            return redirect()->route('laporan.index')
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
}
