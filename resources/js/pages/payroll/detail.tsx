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
    tunjangan_lain: string;
    potongan_tidak_masuk: number;
    potongan_terlambat: number;
    potongan_lain: number;
    total_gaji: number;
    total_potongan: number;
    gaji_bersih: number;
    status: string;
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
    tunjangan: Tunjangan[];
    payroll: PayrollData | null;
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

const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value || 0);
};

const formatBulan = (bulan: string) => {
    if (!bulan) return '-';
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

    const handlePrintSlip = (employee: Employee) => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        const tunjanganLain = employee.payroll?.tunjangan_lain ? JSON.parse(employee.payroll.tunjangan_lain) : [];
        const tunjanganList = employee.tunjangan.map(t => {
            const existing = tunjanganLain.find((x: any) => x.id === t.id);
            return {
                ...t,
                perusahaan: existing?.perusahaan ?? t.perusahaan,
                karyawan: existing?.karyawan ?? t.karyawan
            };
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Slip Gaji - ${employee.nama}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; }
        .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .info-box { width: 48%; }
        .info-box h3 { background: #f0f0f0; padding: 8px; margin: 0 0 10px 0; font-size: 14px; }
        .info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
        .text-right { text-align: right; }
        .total-section { background: #f9f9f9; padding: 15px; border-radius: 5px; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .total-final { font-size: 18px; font-weight: bold; color: #2563eb; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>SLIP GAJI</h1>
        <p>PT. Contoh Perusahaan</p>
        <p>Bulan: ${formatBulan(bulan)}</p>
    </div>

    <div class="info">
        <div class="info-box">
            <h3>Data Karyawan</h3>
            <div class="info-row"><span>NIP:</span> <span>${employee.nip}</span></div>
            <div class="info-row"><span>Nama:</span> <span>${employee.nama}</span></div>
            <div class="info-row"><span>KantorCabang:</span> <span>${employee.kantorCabang || '-'}</span></div>
            <div class="info-row"><span>Jabatan:</span> <span>${employee.jabatan || '-'}</span></div>
        </div>
        <div class="info-box">
            <h3>Kehadiran</h3>
            <div class="info-row"><span>Hari Kerja:</span> <span>${employee.payroll?.hari_kerja || 0} hari</span></div>
            <div class="info-row"><span>Hari Masuk:</span> <span>${employee.payroll?.hari_masuk || 0} hari</span></div>
            <div class="info-row"><span>Jam Terlambat:</span> <span>${employee.payroll?.jam_terlambat || 0} jam</span></div>
            <div class="info-row"><span>Status:</span> <span>${employee.payroll?.status || 'draft'}</span></div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th colspan="2">PENGHASILAN</th>
                <th class="text-right">NOMINAL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td colspan="2">Gaji Pokok</td>
                <td class="text-right">${formatCurrency(employee.gaji_pokok)}</td>
            </tr>
            <tr>
                <td colspan="2">Tunjangan Jabatan</td>
                <td class="text-right">${formatCurrency(employee.tunjangan_jabatan)}</td>
            </tr>
            ${employee.payroll?.insentif ? `
            <tr>
                <td colspan="2">Insentif</td>
                <td class="text-right">${formatCurrency(employee.payroll.insentif)}</td>
            </tr>
            ` : ''}
            ${tunjanganList.filter((t: Tunjangan) => t.perusahaan > 0).map((t: Tunjangan) => `
            <tr>
                <td colspan="2">${t.jenis}</td>
                <td class="text-right">${formatCurrency(t.perusahaan)}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <table>
        <thead>
            <tr>
                <th colspan="2">POTONGAN</th>
                <th class="text-right">NOMINAL</th>
            </tr>
        </thead>
        <tbody>
            ${employee.payroll?.potongan_tidak_masuk ? `
            <tr>
                <td colspan="2">Potongan Tidak Masuk</td>
                <td class="text-right">${formatCurrency(employee.payroll.potongan_tidak_masuk)}</td>
            </tr>
            ` : ''}
            ${employee.payroll?.potongan_terlambat ? `
            <tr>
                <td colspan="2">Potongan Terlambat</td>
                <td class="text-right">${formatCurrency(employee.payroll.potongan_terlambat)}</td>
            </tr>
            ` : ''}
            ${tunjanganList.filter((t: Tunjangan) => t.karyawan > 0).map((t: Tunjangan) => `
            <tr>
                <td colspan="2">${t.jenis} (Potongan)</td>
                <td class="text-right">${formatCurrency(t.karyawan)}</td>
            </tr>
            `).join('')}
            ${employee.payroll?.potongan_lain ? `
            <tr>
                <td colspan="2">Potongan Lain</td>
                <td class="text-right">${formatCurrency(employee.payroll.potongan_lain)}</td>
            </tr>
            ` : ''}
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <span>Total Gaji:</span>
            <span>${formatCurrency(employee.payroll?.total_gaji || 0)}</span>
        </div>
        <div class="total-row">
            <span>Total Potongan:</span>
            <span>${formatCurrency(employee.payroll?.total_potongan || 0)}</span>
        </div>
        <div class="total-row total-final">
            <span>GAJI BERSIH:</span>
            <span>${formatCurrency(employee.payroll?.gaji_bersih || 0)}</span>
        </div>
    </div>

    <div class="footer">
        <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
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
                            <h1 className='text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent dark:from-orange-400 dark:to-orange-300'>
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
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-4 py-2 text-sm font-medium text-white shadow-md shadow-green-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/30 hover:scale-105 active:scale-95"
                        >
                            <Download className="size-4" />
                            Export Excel
                        </button>
                    )}
                </div>

                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-orange-100 dark:shadow-none">
                    <div className="overflow-x-auto">
                        <table className='w-full min-w-[1000px]'>
                            <thead className='bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800'>
                                <tr>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white w-12'>#</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>Karyawan</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>Kantor Cabang</th>
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
                                {!isPublished ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="size-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                                                    <Lock className="size-8 text-yellow-500 dark:text-yellow-400" />
                                                </div>
                                                <p className="text-muted-foreground font-medium">Payroll belum dipublish</p>
                                                <p className="text-sm text-muted-foreground">Data payroll akan muncul setelah status diubah menjadi Published</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : employeesWithPayroll.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="size-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                                    <FileText className="size-8 text-orange-500 dark:text-orange-400" />
                                                </div>
                                                <p className="text-muted-foreground font-medium">Belum ada payroll untuk bulan ini</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    employeesWithPayroll.map((employee, index) => (
                                        <>
                                            <tr key={employee.id} className="hover:bg-orange-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-600 dark:text-orange-400 font-bold text-sm">
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
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-orange-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Menampilkan <span className='font-bold text-orange-600 dark:text-orange-400'>{employeesWithPayroll.length}</span> karyawan dengan payroll
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
