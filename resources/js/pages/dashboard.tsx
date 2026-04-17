import { Head, Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Briefcase, Calendar, Wallet, User, Building2, Users, FileText, Eye, ArrowRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as payrollIndex } from '@/routes/payroll';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

interface EmployeeData {
    nama: string;
    nip: string;
    jabatan: string | null;
    kantor_cabang: string | null;
    tanggal_mulai_kerja: string;
    status_pegawai: string | null;
    ptkp: string | null;
    nomor_rekening: string | null;
}

interface PayrollData {
    bulan: string;
    status: string;
    total_gaji: number;
    total_potongan: number;
    gaji_bersih: number;
}

interface KantorCabangData {
    id: number;
    name: string;
    employees_count: number;
}

interface AdminStats {
    totalEmployees: number;
    totalKantorCabang: number;
    totalPayrolls: number;
}

interface DashboardProps {
    userRole: 'admin' | 'karyawan';
    employee?: EmployeeData | null;
    payrolls?: PayrollData[];
    message?: string;
    stats?: AdminStats;
    kantorCabangs?: KantorCabangData[];
    payrollSummary?: any[];
}

export default function Dashboard(props: DashboardProps) {
    const { userRole, employee, payrolls, message, stats, kantorCabangs, payrollSummary } = props;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatBulan = (bulan: string) => {
        // Handle THR case (e.g., "THR 2026")
        if (bulan.startsWith('THR')) {
            return bulan;
        }
        const [year, month] = bulan.split('-');
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Dashboard for Karyawan
    if (userRole === 'karyawan') {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard Karyawan" />
                <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">
                    {/* Header */}
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent dark:from-red-400 dark:to-red-300'>
                            Dashboard Karyawan
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Selamat datang, {employee?.nama || 'Karyawan'}</p>
                    </div>

                    {message && (
                        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-4">
                            <p className="text-sky-800 dark:text-sky-300">{message}</p>
                        </div>
                    )}

                    {employee && (
                        <>
                            {/* Employee Info Card */}
                            <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
                                <div className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800 px-6 py-4">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <User className="size-5" />
                                        Data Karyawan
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                                            <p className="text-xs text-sky-600 dark:text-sky-400 uppercase font-semibold">Nama</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{employee.nama}</p>
                                        </div>
                                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                                            <p className="text-xs text-sky-600 dark:text-sky-400 uppercase font-semibold">Jenis Kelamin</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                                                {employee.jenis_kelamin === 'laki-laki' ? 'Laki-laki' : employee.jenis_kelamin === 'perempuan' ? 'Perempuan' : '-'}
                                            </p>
                                        </div>
                                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                                            <p className="text-xs text-sky-600 dark:text-sky-400 uppercase font-semibold">NIK</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{employee.nik || '-'}</p>
                                        </div>
                                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                                            <p className="text-xs text-sky-600 dark:text-sky-400 uppercase font-semibold">NIP</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{employee.nip}</p>
                                        </div>
                                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                                            <p className="text-xs text-sky-600 dark:text-sky-400 uppercase font-semibold">Jabatan</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{employee.jabatan || '-'}</p>
                                        </div>
                                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                                            <p className="text-xs text-sky-600 dark:text-sky-400 uppercase font-semibold">Cabang</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{employee.kantor_cabang || '-'}</p>
                                        </div>
                                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                                            <p className="text-xs text-sky-600 dark:text-sky-400 uppercase font-semibold">Status Pegawai</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{employee.status_pegawai || '-'}</p>
                                        </div>
                                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                                            <p className="text-xs text-sky-600 dark:text-sky-400 uppercase font-semibold">Tanggal Mulai Kerja</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{formatDate(employee.tanggal_mulai_kerja)}</p>
                                        </div>
                                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                                            <p className="text-xs text-sky-600 dark:text-sky-400 uppercase font-semibold">Status PTKP</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{employee.ptkp || '-'}</p>
                                        </div>
                                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                                            <p className="text-xs text-sky-600 dark:text-sky-400 uppercase font-semibold">Nomor KJT</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{employee.kjt || '-'}</p>
                                        </div>
                                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                                            <p className="text-xs text-sky-600 dark:text-sky-400 uppercase font-semibold">Nomor Rekening</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{employee.nomor_rekening || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payroll History */}
                            <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
                                <div className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800 px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Wallet className="size-5" />
                                        Riwayat Gaji
                                    </h2>
                                </div>
                                <div className="p-6">
                                    {!payrolls || payrolls.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Wallet className="size-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500">Belum ada slip gaji</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {payrolls.map((payroll) => (
                                                <div key={payroll.bulan} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                                                            <Calendar className="size-5 text-sky-600 dark:text-sky-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{formatBulan(payroll.bulan)}</p>
                                                            <p className="text-xs text-gray-500">Gaji Bersih: {formatCurrency(payroll.gaji_bersih)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-sky-600 dark:text-sky-400">{formatCurrency(payroll.gaji_bersih)}</p>
                                                        <Link
                                                            href={`/payroll/${payroll.bulan}/detail?status=${employee.status_pegawai}`}
                                                            className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 mt-1"
                                                        >
                                                            <Eye className="size-3" />
                                                            Lihat Slip
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </AppLayout>
        );
    }

    // Dashboard for Admin
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">
                {/* Header */}
                <div>
                    <h1 className='text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent dark:from-red-400 dark:to-red-300'>
                        Dashboard Admin
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Ringkasan data perusahaan</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-semibold">Total Karyawan</h3>
                                <Users className="size-6 text-white/80" />
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalEmployees || 0}</p>
                            <p className="text-sm text-gray-500 mt-1">Karyawan aktif</p>
                        </div>
                    </div>

                    <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
                        <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-semibold">Cabang</h3>
                                <Building2 className="size-6 text-white/80" />
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalKantorCabang || 0}</p>
                            <p className="text-sm text-gray-500 mt-1">Cabang tersedia</p>
                        </div>
                    </div>

                    <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
                        <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-semibold">Total Payroll</h3>
                                <Wallet className="size-6 text-white/80" />
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalPayrolls || 0}</p>
                            <p className="text-sm text-gray-500 mt-1">Payroll published</p>
                        </div>
                    </div>
                </div>

                {/* Kantor Cabang dengan Jumlah Karyawan */}
                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800 px-6 py-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Building2 className="size-5" />
                            Cabang & Jumlah Karyawan
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kantorCabangs && kantorCabangs.length > 0 ? (
                                kantorCabangs.map((kc) => (
                                    <div key={kc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                                                <Building2 className="size-5 text-sky-600 dark:text-sky-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{kc.name}</p>
                                                <p className="text-xs text-gray-500">{kc.employees_count} karyawan</p>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/30 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                                            {kc.employees_count} orang
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 col-span-full text-center py-4">Belum ada cabang</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payroll Summary */}
                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
                    <div className="bg-gradient-to-r from-sky-500 to-sky-600 dark:from-sky-700 dark:to-sky-800 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileText className="size-5" />
                            Riwayat Payroll
                        </h2>
                        <Link
                            href={payrollIndex().url}
                            className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
                        >
                            Lihat Semua <ArrowRight className="size-4" />
                        </Link>
                    </div>
                    <div className="p-6">
                        {payrollSummary && payrollSummary.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className='w-full'>
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Bulan</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status Pegawai</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah Karyawan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {payrollSummary.slice(0, 10).map((payroll, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="px-4 py-3 text-gray-900 dark:text-white">{formatBulan(payroll.bulan)}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/30 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                                                        {payroll.status_pegawai || 'Semua'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">{payroll.details_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FileText className="size-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500">Belum ada payroll</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
