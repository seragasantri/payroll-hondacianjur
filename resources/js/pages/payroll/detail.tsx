import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer, Download, FileText, Calendar, User, Building, Briefcase, Lock } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Tunjangan {
    id: number;
    jenis: string;
    perusahaan: number;
    karyawan: number;
}

interface PayrollData {
    id: number;
    hari_kerja: number;
    hari_masuk: number;
    jam_terlambat: number;
    insentif: number;
    uang_hadir: number;
    lembur: number;
    reward: number;
    lain_lain: number;
    kasbon: number;
    tunjangan_lain: string;
    potongan_tidak_masuk: number;
    potongan_terlambat: number;
    potongan_lain: number;
    total_gaji: number;
    total_potongan: number;
    gaji_bersih: number;
    status: string;
    pph21_amount?: number;
    tax_method?: string;
    tax_rate_applied?: number;
}

interface Employee {
    id: number;
    nip: string;
    nama: string;
    kantorCabang: string;
    jabatan: string;
    gaji_pokok: number;
    tunjangan_jabatan: number;
    potongan_tidak_masuk: number;
    potongan_terlambat: number;
    tanggal_mulai_kerja: string;
    tunjangan: Tunjangan[];
    payroll: PayrollData | null;
    bpjs_ketenagakerjaan?: boolean;
    tunjangan_bpjs_kes?: boolean;
    tunjangan_jht?: boolean;
    tunjangan_jkk?: boolean;
    tunjangan_jkm?: boolean;
    tunjangan_pensiun?: boolean;
}

interface Props {
    bulan: string;
    status_pegawai: string;
    status: string;
    employees: Employee[];
    tunjanganList: Tunjangan[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

const formatRupiahTable = (amount: number) => {
    const num = amount || 0;
    const formatted = new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
    return `<span style="float: left;">Rp</span><span style="float: right;">${formatted}</span>`;
};

const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value || 0);
};
const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const formatBulan = (bulan: string) => {
    if (!bulan) return '-';
    // Handle THR case (e.g., "THR 2026")
    if (bulan.startsWith('THR')) {
        return bulan;
    }
    const parts = bulan.split('-');
    if (parts.length !== 2) return bulan;
    const [year, month] = parts;
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Payroll',
        href: '/payroll'
    },
    {
        title: 'Detail',
        href: '#'
    }
];

export default function PayrollDetail({ bulan, status_pegawai, status, employees }: Props) {
    console.log("🚀 ~ PayrollDetail ~ employees:", employees)
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.is_super_admin ?? false;
    const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);

    const isPublished = status === 'published';

    const toggleExpand = (employeeId: number) => {
        setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId);
    };

    const handleExport = () => {
        const params = new URLSearchParams({ bulan, status: status_pegawai });
        window.open(`/payroll/${bulan}/export?${params.toString()}`, '_blank');
    };

    const handleExportDetail = () => {
        const params = new URLSearchParams({ bulan, status: status_pegawai });
        window.open(`/payroll/${bulan}/export-detail?${params.toString()}`, '_blank');
    };

    const handlePrintSlip = (employee: Employee) => {
        console.log("🚀 ~ handlePrintSlip ~ employee:", employee.payroll)
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        // Parse tunjangan_lain - handle both array (old format) and object (new format)
        const tunjanganLainParsed = employee.payroll?.tunjangan_lain ? JSON.parse(employee.payroll.tunjangan_lain) : [];
        // Convert to object with string keys if it's an array
        const tunjanganLainRaw: Record<string, any> = Array.isArray(tunjanganLainParsed)
            ? tunjanganLainParsed.reduce((acc: Record<string, any>, item: any) => {
                acc[String(item.id)] = item;
                return acc;
            }, {})
            : tunjanganLainParsed;

        // Map tunjangan and filter based on employee checkbox settings
        // Tunjangan IDs: 1=BPJS Kesehatan, 2=JHT, 3=JKK, 4=JKM, 5=Pensiun
        // If bpjs_ketenagakerjaan is unchecked, don't show any bpjs-related tunjangan
        const bpjsChecked = !!employee.bpjs_ketenagakerjaan;
        const tunjanganList = (Array.isArray(employee.tunjangan) ? employee.tunjangan : [])
            .filter(t => {
                const id = String(t.id);
                // If bpjs_ketenagakerjaan is not checked, don't show bpjs-related tunjangan
                if (!bpjsChecked) return false;
                // Filter based on checkbox settings - only show if explicitly checked
                if (id === '1') return !!employee.tunjangan_bpjs_kes;
                if (id === '2') return !!employee.tunjangan_jht;
                if (id === '3') return !!employee.tunjangan_jkk;
                if (id === '4') return !!employee.tunjangan_jkm;
                if (id === '5') return !!employee.tunjangan_pensiun;
                return true; // Other tunjangan always show
            })
            .map(t => {
                const key = String(t.id);
                const existing = tunjanganLainRaw[key];
                return {
                    ...t,
                    perusahaan: existing?.perusahaan ?? t.perusahaan,
                    karyawan: existing?.karyawan ?? t.karyawan
                };
            });

        const html = `
<!doctype html>
<html>
    <head>
        <title>Slip Gaji - ${employee.nama}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
            }
            .row { display: flex; }
            .col-left { width: 50%; padding-right: 20px; }
            .col-right { width: 50%; padding-left: 20px; }
            table { border-collapse: collapse; width: 100%; }
            td, th { padding: 3px 5px; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .border-top { border-top: 1px solid #000; }
            }
            @page {
                size: portrait;
                margin: 10mm;
            }
            @media print {
                body { padding: 0; }
            }
        </style>
    </head>
    <body>
        <div style="margin-bottom: 20px;">
            <div style="display: block">
                <img src="/assets/images/logo_2.png" width="250" alt="Logo" />
                <br />
                <b>PUSAKA MOTOR UTAMA</b><br />
                <b>SLIP GAJI</b><br />
                <b>PERIODE </b>${formatBulan(bulan)}
            </div>
        </div>

        <div class="row" style="margin-bottom: 20px;">
            <div class="col-left">
                <table style="width: 100%">
                    <tr>
                        <td class="text-left">NAMA</td>
                        <td>:</td>
                        <td class="text-left">${employee.nama || '-'}</td>
                    </tr>
                    <tr>
                        <td class="text-left">NIP</td>
                        <td>:</td>
                        <td class="text-left">${employee.nip || '-'}</td>
                    </tr>
                     <tr>
                        <td class="text-left">TGL MASUK</td>
                        <td>:</td>
                        <td class="text-left">${formatDate(employee.tanggal_mulai_kerja)}</td>
                    </tr>
                   
                </table>
            </div>
            <div class="col-right">
                <table style="width: 100%">
                   
                    <tr>
                        <td class="text-left">STATUS</td>
                        <td>:</td>
                        <td class="text-left">${status_pegawai || '-'}</td>
                    </tr>
                   <tr>
                        <td class="text-left">JABATAN</td>
                        <td>:</td>
                        <td class="text-left">${employee.jabatan || '-'}</td>
                    </tr>
                    <tr>
                        <td class="text-left">KANTOR</td>
                        <td>:</td>
                        <td class="text-left">${employee.kantorCabang || '-'}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="row" style="margin-top: 20px;">
            <div class="col-left">
                <table style="width: 100%">
                    <tr>
                        <th class="text-left" colspan="3">PENDAPATAN</th>
                    </tr>
                    <tr>
                        <td class="text-left">GAJI POKOK</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable(employee.gaji_pokok)}</td>
                    </tr>
                    <tr>
                        <td class="text-left">TUNJANGAN JABATAN</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable(employee.tunjangan_jabatan)}</td>
                    </tr>
                    <tr>
                        <td class="text-left">INSENTIF BULANAN</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable(employee.payroll?.insentif || 0)}</td>
                    </tr>
                    <tr>
                        <td class="text-left">UANG HADIR</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable(employee.payroll?.uang_hadir || 0)}</td>
                    </tr>
                    <tr>
                        <td class="text-left">LEMBUR</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable(employee.payroll?.lembur || 0)}</td>
                    </tr>
                    <tr>
                        <td class="text-left">REWARD</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable(employee.payroll?.reward || 0)}</td>
                    </tr>
                    <tr>
                        <td class="text-left">LAIN-LAIN</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable(employee.payroll?.lain_lain || 0)}</td>
                    </tr>

                </table>
            </div>
            <div class="col-right">
                <table style="width: 100%">
                    <tr>
                        <th class="text-left" colspan="3">POTONGAN</th>
                    </tr>
                    <tr>
                        <td class="text-left">TIDAK MASUK (${employee.payroll?.hari_kerja - employee.payroll?.hari_masuk || 0} hari)</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable(employee.payroll?.potongan_tidak_masuk || 0)}</td>
                    </tr>
                    <tr>
                        <td class="text-left">TERLAMBAT (${employee.payroll?.jam_terlambat || 0} jam)</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable(employee.payroll?.potongan_terlambat || 0)}</td>
                    </tr>
                   
                    <tr>
                        <td class="text-left">PINJAMAN KARYAWAN</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable(employee.payroll?.kasbon || 0)}</td>
                    </tr>

                    <tr>
                        <td class="text-left">PAJAK</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable(employee.payroll?.pph21_amount || 0)}</td>
                    </tr>
                </table>
            </div>
        </div>

          <div class="row" style="margin-top: 20px;">

            <div class="col-left">
                <table style="width: 100%">
                  ${tunjanganList.length > 0 ? (
                `
                    <tr>
                        <th class="text-left" colspan="3">TUNJANGAN PERUSAHAAN</th>
                    </tr>
                    `
            ) : ''}
                    ${tunjanganList.map((t: Tunjangan) => `
                    <tr>
                        <td class="text-left">${t.jenis}</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable(t.perusahaan)}</td>
                    </tr>
                    `).join('')}
                </table>
            </div>
            <div class="col-right">
                <table style="width: 100%">
                    <tr>
                        <td colspan="3">&nbsp;</td>
                    </tr>

                    ${tunjanganList.map((t: Tunjangan) => `
                    <tr>
                        <td class="text-left">${t.jenis}</td>
                        <td>:</td>
                        <td class="text-right">${formatRupiahTable((t.perusahaan || 0) + (t.karyawan || 0))}</td>
                    </tr>
                    `).join('')}

                </table>
            </div>
        </div>

        <div style="margin-top: 30px;">
            <table style="width: 100%;">
                <tr>
                    <td class="text-left bold">TOTAL PENDAPATAN</td>
                    <td>:</td>
                    <td class="text-right">${formatRupiahTable(employee.payroll?.total_gaji || 0)}</td>
                </tr>
                <tr>
                    <td class="text-left bold">TOTAL POTONGAN</td>
                    <td>:</td>
                    <td class="text-right">${formatRupiahTable(employee.payroll?.total_potongan || 0)}</td>
                </tr>
                <tr class="border-top">
                    <td class="text-left bold">GAJI DITERIMA</td>
                    <td>:</td>
                    <td class="text-right bold">${formatRupiahTable(employee.payroll?.gaji_bersih || 0)}</td>
                </tr>
            </table>
        </div>

        <div style="margin-top: 40px; text-align: right;">
            <p>Diterima oleh,</p>
            <br /><br /><br />
            <p>${employee.nama}</p>
        </div>

        <script>
        window.onload = function() {
            window.print();
        }
    </script>
    </body>
</html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleDownloadSlip = (employee: Employee) => {
        handlePrintSlip(employee);
    };

    const employeesWithPayroll = employees.filter(e => e.payroll);
    const totalGajiBersih = employeesWithPayroll.reduce((sum, e) => sum + (e.payroll?.gaji_bersih || 0), 0);
    const totalKaryawan = employeesWithPayroll.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll ${formatBulan(bulan)}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.get('/payroll')}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali
                        </button>
                        <div>
                            <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300'>
                                Payroll {formatBulan(bulan)}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
                                    {status_pegawai}
                                </span>
                                {isPublished ? (
                                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300">
                                        Published
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                                        Draft
                                    </span>
                                )}
                                <span className="text-muted-foreground text-sm">
                                    {totalKaryawan} Karyawan • Total {formatCurrency(totalGajiBersih)}
                                </span>
                            </div>
                        </div>
                    </div>
                    {isPublished && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExportDetail}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-95"
                            >
                                <Download className="size-4" />
                                Detail
                            </button>
                        </div>
                    )}
                </div>

                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-blue-100 dark:shadow-none">
                    <div className="overflow-x-auto">
                        <table className='w-full min-w-[1000px]'>
                            <thead className='bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800'>
                                <tr>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white w-12'>#</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>Karyawan</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>Kantor Cabbang</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>Jabatan</th>
                                    <th className='px-4 py-4 text-right text-sm font-bold text-white'>Gaji Pokok</th>
                                    <th className='px-4 py-4 text-right text-sm font-bold text-white'>Total Gaji</th>
                                    <th className='px-4 py-4 text-right text-sm font-bold text-white'>Total Potongan</th>
                                    <th className='px-4 py-4 text-right text-sm font-bold text-white'>Gaji Bersih</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>Status</th>
                                    <th className='rounded-tr-2xl px-4 py-4 text-center text-sm font-bold text-white w-32'>Aksi</th>
                                </tr>
                            </thead>

                            <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                                {!isPublished && employeesWithPayroll.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="size-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                                    <FileText className="size-8 text-blue-500 dark:text-blue-400" />
                                                </div>
                                                <p className="text-muted-foreground font-medium">Belum ada payroll untuk bulan ini</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    employeesWithPayroll.map((employee, index) => (
                                        <>
                                            <tr key={employee.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                            <User className="size-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{employee.nama}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{employee.nip}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
                                                        {employee.kantorCabang || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-gray-900 dark:text-gray-300">
                                                    {employee.jabatan || '-'}
                                                </td>
                                                <td className="px-4 py-4 text-right text-gray-900 dark:text-gray-300">
                                                    {formatCurrency(employee.gaji_pokok)}
                                                </td>
                                                <td className="px-4 py-4 text-right text-green-600 dark:text-green-400 font-medium">
                                                    {formatCurrency(employee.payroll?.total_gaji || 0)}
                                                </td>
                                                <td className="px-4 py-4 text-right text-red-600 dark:text-red-400">
                                                    {formatCurrency(employee.payroll?.total_potongan || 0)}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                                        {formatCurrency(employee.payroll?.gaji_bersih || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {employee.payroll?.status === 'published' ? (
                                                        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">Published</span>
                                                    ) : employee.payroll?.status === 'paid' ? (
                                                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300">Lunas</span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-xs font-semibold text-yellow-700 dark:text-yellow-300">Draft</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleDownloadSlip(employee)}
                                                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95"
                                                        >
                                                            <Download className="size-3" />
                                                            Slip
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {employeesWithPayroll.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-blue-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Menampilkan <span className='font-bold text-blue-600 dark:text-blue-400'>{employeesWithPayroll.length}</span> karyawan dengan payroll
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
