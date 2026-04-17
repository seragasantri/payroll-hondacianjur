import { Head, router, usePage, Link } from '@inertiajs/react';
import { PlusCircle, Trash2, Pencil, FileText, Send, Calendar, Eye, Download, Wallet, User } from 'lucide-react';
import Swal from 'sweetalert2';
import { useCan } from '@/hooks/useCan';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface PayrollSummary {
    id: number;
    bulan: string;
    status_pegawai: string;
    status: 'draft' | 'published' | 'paid';
    details_count: number;
}

interface PayrollList {
    data: PayrollSummary[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Payroll',
        href: '#'
    }
];

export default function PayrollIndex({ payrollSummary, isKaryawan = false }: { payrollSummary: PayrollList; isKaryawan?: boolean }) {
    const can = useCan();
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.is_super_admin ?? false;

    const formatBulan = (bulan: string) => {
        // Handle THR case (e.g., "THR 2026")
        if (bulan.startsWith('THR')) {
            return bulan;
        }
        const [year, month] = bulan.split('-');
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">Draft</span>;
            case 'published':
                return <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">Published</span>;
            case 'paid':
                return <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">Lunas</span>;
            default:
                return null;
        }
    };

    const handleCreate = async () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');

        // Generate year options (current year and 2 years back)
        const years = [currentYear, currentYear - 1, currentYear - 2];

        // Indonesian month names
        const monthNames = [
            { value: '01', label: 'Januari' },
            { value: '02', label: 'Februari' },
            { value: '03', label: 'Maret' },
            { value: '04', label: 'April' },
            { value: '05', label: 'Mei' },
            { value: '06', label: 'Juni' },
            { value: '07', label: 'Juli' },
            { value: '08', label: 'Agustus' },
            { value: '09', label: 'September' },
            { value: '10', label: 'Oktober' },
            { value: '11', label: 'November' },
            { value: '12', label: 'Desember' }
        ];

        const yearOptions = years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('');
        const monthOptions = monthNames.map(m => `<option value="${m.value}" ${m.value === currentMonth ? 'selected' : ''}>${m.label}</option>`).join('');

        const { value: formValues } = await Swal.fire({
            title: 'Buat Payroll',
            text: `Payroll bulan mana yang ingin dibuat?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Buat',
            cancelButtonText: 'Batal',
            html: `
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">Jenis Payroll</label>
                    <select id="swal-jenis-payroll" class="swal2-select">
                        <option value="bulanan">Payroll Bulanan</option>
                        <option value="thr">THR (Tunjangan Hari Raya)</option>
                    </select>
                </div>
                <div id="payroll-bulanan-options" class="mb-4 flex gap-2">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">Bulan</label>
                        <select id="swal-bulan" class="swal2-select">
                            ${monthOptions}
                        </select>
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">Tahun</label>
                        <select id="swal-tahun" class="swal2-select">
                            ${yearOptions}
                        </select>
                    </div>
                </div>
                <div id="payroll-thr-options" class="mb-4" style="display: none;">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">Tahun</label>
                    <select id="swal-tahun-thr" class="swal2-select">
                        ${yearOptions}
                    </select>
                </div>
                <div id="payroll-status-options">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">Status Pegawai</label>
                    <select id="swal-status" class="swal2-select">
                        <option value="Pegawai Tetap">Pegawai Tetap</option>
                        <option value="Pegawai Kontrak">Pegawai Kontrak</option>
                    </select>
                </div>
            `,
            focusConfirm: false,
            didOpen: () => {
                const jenisSelect = document.getElementById('swal-jenis-payroll') as HTMLSelectElement;
                const bulananOptions = document.getElementById('payroll-bulanan-options') as HTMLElement;
                const thrOptions = document.getElementById('payroll-thr-options') as HTMLElement;
                const statusOptions = document.getElementById('payroll-status-options') as HTMLElement;

                const toggleOptions = () => {
                    if (jenisSelect.value === 'thr') {
                        bulananOptions.style.display = 'none';
                        thrOptions.style.display = 'block';
                        statusOptions.style.display = 'none';
                    } else {
                        bulananOptions.style.display = 'flex';
                        thrOptions.style.display = 'none';
                        statusOptions.style.display = 'block';
                    }
                };

                // Add event listener
                jenisSelect.addEventListener('change', toggleOptions);
            },
            preConfirm: () => {
                const jenisPayroll = (document.getElementById('swal-jenis-payroll') as HTMLSelectElement).value;
                const bulan = (document.getElementById('swal-bulan') as HTMLSelectElement).value;
                const tahun = (document.getElementById('swal-tahun') as HTMLSelectElement).value;
                const tahunThr = (document.getElementById('swal-tahun-thr') as HTMLSelectElement)?.value;
                const status = (document.getElementById('swal-status') as HTMLSelectElement)?.value || '';

                if (jenisPayroll === 'thr') {
                    const thrValue = `THR ${tahunThr}`;
                    return { bulan: thrValue, status: thrValue };
                }

                const fullBulan = `${tahun}-${bulan}`;
                return { bulan: fullBulan, status };
            }
        });

        if (formValues) {
            const { bulan, status } = formValues;

            // Check if payroll already exists
            try {
                const response = await fetch(`/payroll/check?bulan=${bulan}&status=${encodeURIComponent(status)}`);
                const data = await response.json();

                if (data.exists) {
                    if (data.payroll_status === 'published') {
                        // Show info alert - published payroll cannot be edited
                        await Swal.fire({
                            title: 'Perhatian!',
                            html: `
                                <div class="text-left">
                                    <p class="mb-2">${data.message}</p>
                                    <p class="text-sm text-gray-500">Status: <span class="font-semibold">Published</span></p>
                                </div>
                            `,
                            icon: 'info',
                            confirmButtonColor: '#3b82f6',
                            confirmButtonText: 'OK'
                        });
                        return;
                    } else {
                        // Navigate to edit for draft payroll
                        router.get(`/payroll/${bulan}/edit`);
                    }
                } else {
                    // Create new payroll
                    const params: Record<string, string> = { bulan };
                    if (status) {
                        params.status = status;
                    }
                    router.get('/payroll/create', params);
                }
            } catch {
                // If check fails, just proceed to create
                const params: Record<string, string> = { bulan };
                if (status) {
                    params.status = status;
                }
                router.get('/payroll/create', params);
            }
        }
    };

    const handleEdit = (bulan: string, statusFilter?: string | null) => {
        const params: Record<string, string> = {};
        if (statusFilter) {
            params.status = statusFilter;
        }
        router.get(`/payroll/${bulan}/edit`, params);
    };

    const handleDetail = (bulan: string, statusFilter?: string | null) => {
        const params: Record<string, string> = {};
        if (statusFilter) {
            params.status = statusFilter;
        }
        router.get(`/payroll/${bulan}/detail`, params);
    };

    const handleDelete = (bulan: string, statusPegawai?: string | null) => {
        const bulanFormatted = formatBulan(bulan);
        Swal.fire({
            title: 'Hapus Payroll?',
            text: `Apakah Anda yakin ingin menghapus payroll ${bulanFormatted}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal',
            preConfirm: () => {
                const params: Record<string, string> = {};
                if (statusPegawai) {
                    params.status = statusPegawai;
                }
                return router.delete(`/payroll/${bulan}`, {
                    data: params,
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Terhapus!',
                            text: 'Data payroll berhasil dihapus.',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    };

    const handlePublish = (bulan: string, statusPegawai?: string | null) => {
        Swal.fire({
            title: 'Publish Payroll',
            text: `Apakah Anda ingin publish payroll ${formatBulan(bulan)}${statusPegawai ? ' (' + statusPegawai + ')' : ''}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, publish!',
            cancelButtonText: 'Batal',
            preConfirm: () => {
                const params: Record<string, string> = { bulan };
                if (statusPegawai) {
                    params.status = statusPegawai;
                }
                return router.post('/payroll/publish', params, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Berhasil!',
                            text: 'Payroll berhasil dipublish.',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    };

    const handleExport = (bulan: string, statusPegawai?: string | null) => {
        const params = new URLSearchParams({ bulan });
        if (statusPegawai) {
            params.append('status', statusPegawai);
        }
        window.open(`/payroll/${bulan}/export?${params.toString()}`, '_blank');
    };

    const handleExportDetail = (bulan: string, statusPegawai?: string | null) => {
        const params = new URLSearchParams({ bulan });
        if (statusPegawai) {
            params.append('status', statusPegawai);
        }
        window.open(`/payroll/${bulan}/export-detail?${params.toString()}`, '_blank');
    };

    const handleExportTunai = (bulan: string, statusPegawai?: string | null) => {
        const params = new URLSearchParams({ bulan });
        if (statusPegawai) {
            params.append('status', statusPegawai);
        }
        window.open(`/payroll/${bulan}/export-tunai?${params.toString()}`, '_blank');
    };

    // Special view for Karyawan (employee) role
    if (isKaryawan) {
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
        };

        const formatBulanPayroll = (bulan: string) => {
            if (bulan.startsWith('THR')) return bulan;
            const [year, month] = bulan.split('-');
            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        };

        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Payroll Saya" />
                <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">
                    {/* Header */}
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent dark:from-red-400 dark:to-red-300'>
                            Payroll Saya
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Riwayat gaji Anda</p>
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
                            {!payrollSummary?.data || payrollSummary.data.length === 0 ? (
                                <div className="text-center py-8">
                                    <Wallet className="size-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">Belum ada slip gaji</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {payrollSummary.data.map((payroll) => (
                                        <div key={payroll.bulan} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                                                    <Calendar className="size-5 text-sky-600 dark:text-sky-400" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{formatBulanPayroll(payroll.bulan)}</p>
                                                    <p className="text-xs text-gray-500">{payroll.status_pegawai || 'Pegawai'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Link
                                                    href={`/payroll/${payroll.bulan}/detail`}
                                                    className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                                                >
                                                    <Eye className="size-4" />
                                                    Lihat Slip
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Normal view for Admin/Super Admin
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Payroll" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent dark:from-red-400 dark:to-red-300'>
                            {isKaryawan ? 'Payroll Saya' : 'Manajemen Payroll'}
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">{isKaryawan ? 'Riwayat gaji Anda' : 'Kelola data payroll karyawan per bulan'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {(isSuperAdmin || can('payroll.create')) && !isKaryawan && (
                            <button
                                onClick={handleCreate}
                                className='inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-500 dark:hover:from-red-700 dark:hover:to-red-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-red-500/30 dark:shadow-red-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105 active:scale-95'
                            >
                                <PlusCircle className='size-5' />
                                <span>Buat Payroll</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-sky-100 dark:shadow-none">
                    <div className="overflow-x-auto">
                        <table className='w-full min-w-[600px]'>
                            <thead className='bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800'>
                                <tr>
                                    <th className='rounded-tl-2xl px-4 py-4 text-left text-sm font-bold text-white w-12'>#</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>
                                        <button className='flex items-center gap-2 hover:text-sky-100 transition-colors cursor-pointer'>
                                            <Calendar className="size-4" />
                                            <span>Bulan Payroll</span>
                                        </button>
                                    </th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>Status Pegawai</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>Status</th>
                                    <th className='rounded-tr-2xl px-4 py-4 text-center text-sm font-bold text-white w-40'>Aksi</th>
                                </tr>
                            </thead>

                            <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                                {!payrollSummary?.data || payrollSummary.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="size-16 rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
                                                    <FileText className="size-8 text-red-500 dark:text-sky-400" />
                                                </div>
                                                <p className="text-muted-foreground font-medium">{isKaryawan ? 'Belum ada riwayat gaji' : 'Belum ada payroll'}</p>
                                                <p className="text-sm text-muted-foreground">{isKaryawan ? 'Gaji akan muncul di sini setelah di publish' : 'Klik "Buat Payroll" untuk memulai'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    payrollSummary.data.map((item, index) => (
                                        <tr key={item.bulan} className="hover:bg-sky-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/30 dark:to-sky-800/30 text-sky-600 dark:text-sky-400 font-bold text-sm">
                                                    {payrollSummary.meta?.from ? payrollSummary.meta.from + index : index + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                                                        <Calendar className="size-5 text-sky-600 dark:text-sky-400" />
                                                    </div>
                                                    <span className="font-semibold text-gray-900 dark:text-white">{formatBulan(item.bulan)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {item.status_pegawai ? (
                                                    <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/30 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                                                        {item.status_pegawai}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-900/30 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {getStatusBadge(item.status)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleDetail(item.bulan, item.status_pegawai)}
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95"
                                                    >
                                                        <Eye className="size-3" />
                                                        <span>Detail</span>
                                                    </button>
                                                    {(isSuperAdmin || can('payroll.update')) && item.status === 'draft' && !isKaryawan && (
                                                        <button
                                                            onClick={() => handleEdit(item.bulan, item.status_pegawai)}
                                                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/30 hover:scale-105 active:scale-95"
                                                        >
                                                            <Pencil className="size-3" />
                                                            <span>Edit</span>
                                                        </button>
                                                    )}
                                                    {(isSuperAdmin || can('payroll.publish')) && item.status === 'draft' && !isKaryawan && (
                                                        <button
                                                            onClick={() => handlePublish(item.bulan, item.status_pegawai)}
                                                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/30 hover:scale-105 active:scale-95"
                                                        >
                                                            <Send className="size-3" />
                                                            <span>Publish</span>
                                                        </button>
                                                    )}
                                                    {isSuperAdmin && item.status === 'published' && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleExportTunai(item.bulan, item.status_pegawai)}
                                                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95"
                                                                title="Export Tunai"
                                                            >
                                                                <Download className="size-3" />
                                                                <span>Tunai</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleExport(item.bulan, item.status_pegawai)}
                                                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/30 hover:scale-105 active:scale-95"
                                                                title="Export BCA"
                                                            >
                                                                <Download className="size-3" />
                                                                <span>BCA</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                    {(isSuperAdmin || can('payroll.delete')) && item.status === 'draft' && !isKaryawan && (
                                                        <button
                                                            onClick={() => handleDelete(item.bulan, item.status_pegawai)}
                                                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {payrollSummary?.meta && payrollSummary.data.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-sky-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Menampilkan <span className='font-bold text-sky-600 dark:text-sky-400'>{payrollSummary.meta?.from}</span> sampai <span className='font-bold text-sky-600 dark:text-sky-400'>{payrollSummary.meta?.to}</span> dari <span className='font-bold text-sky-600 dark:text-sky-400'>{payrollSummary.meta?.total}</span> data
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
