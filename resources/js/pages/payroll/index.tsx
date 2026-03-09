import { Head, router, usePage } from '@inertiajs/react';
import { PlusCircle, Trash2, Pencil, FileText, Send, Calendar, Eye, Download } from 'lucide-react';
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
        const [year, month] = bulan.split('-');
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-xs font-semibold text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">Draft</span>;
            case 'published':
                return <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Published</span>;
            case 'paid':
                return <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">Lunas</span>;
            default:
                return null;
        }
    };

    const handleCreate = async () => {
        const currentBulan = new Date().toISOString().slice(0, 7);

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
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">Bulan</label>
                    <input type="text" id="swal-bulan" class="swal2-input" placeholder="YYYY-MM" value="${currentBulan}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">Status Pegawai</label>
                    <select id="swal-status" class="swal2-select">
                        <option value="Pegawai Tetap">Pegawai Tetap</option>
                        <option value="Pegawai Kontrak">Pegawai Kontrak</option>
                    </select>
                </div>
            `,
            focusConfirm: false,
            preConfirm: () => {
                const bulan = (document.getElementById('swal-bulan') as HTMLInputElement).value;
                const status = (document.getElementById('swal-status') as HTMLSelectElement).value;

                if (!bulan || !/^\d{4}-\d{2}$/.test(bulan)) {
                    Swal.showValidationMessage('Format harus YYYY-MM');
                    return false;
                }

                return { bulan, status };
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Payroll" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300'>
                            {isKaryawan ? 'Payroll Saya' : 'Manajemen Payroll'}
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">{isKaryawan ? 'Riwayat gaji Anda' : 'Kelola data payroll karyawan per bulan'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {(isSuperAdmin || can('payroll.create')) && !isKaryawan && (
                            <button
                                onClick={handleCreate}
                                className='inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-500 dark:hover:from-blue-700 dark:hover:to-blue-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95'
                            >
                                <PlusCircle className='size-5' />
                                <span>Buat Payroll</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-blue-100 dark:shadow-none">
                    <div className="overflow-x-auto">
                        <table className='w-full min-w-[600px]'>
                            <thead className='bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800'>
                                <tr>
                                    <th className='rounded-tl-2xl px-4 py-4 text-left text-sm font-bold text-white w-12'>#</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>
                                        <button className='flex items-center gap-2 hover:text-blue-100 transition-colors cursor-pointer'>
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
                                                <div className="size-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                                    <FileText className="size-8 text-blue-500 dark:text-blue-400" />
                                                </div>
                                                <p className="text-muted-foreground font-medium">{isKaryawan ? 'Belum ada riwayat gaji' : 'Belum ada payroll'}</p>
                                                <p className="text-sm text-muted-foreground">{isKaryawan ? 'Gaji akan muncul di sini setelah di publish' : 'Klik "Buat Payroll" untuk memulai'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    payrollSummary.data.map((item, index) => (
                                        <tr key={item.bulan} className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                    {payrollSummary.meta?.from ? payrollSummary.meta.from + index : index + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                        <Calendar className="size-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <span className="font-semibold text-gray-900 dark:text-white">{formatBulan(item.bulan)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {item.status_pegawai ? (
                                                    <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
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
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-95"
                                                    >
                                                        <Eye className="size-3" />
                                                        <span>Detail</span>
                                                    </button>
                                                    {(isSuperAdmin || can('payroll.update')) && item.status === 'draft' && !isKaryawan && (
                                                        <button
                                                            onClick={() => handleEdit(item.bulan, item.status_pegawai)}
                                                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-amber-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 active:scale-95"
                                                        >
                                                            <Pencil className="size-3" />
                                                            <span>Edit</span>
                                                        </button>
                                                    )}
                                                    {(isSuperAdmin || can('payroll.publish')) && item.status === 'draft' && !isKaryawan && (
                                                        <button
                                                            onClick={() => handlePublish(item.bulan, item.status_pegawai)}
                                                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-green-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/30 hover:scale-105 active:scale-95"
                                                        >
                                                            <Send className="size-3" />
                                                            <span>Publish</span>
                                                        </button>
                                                    )}
                                                    {item.status === 'published' && (
                                                        <button
                                                            onClick={() => handleExport(item.bulan, item.status_pegawai)}
                                                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-95"
                                                        >
                                                            <Download className="size-3" />
                                                            <span>Export</span>
                                                        </button>
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
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-blue-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Menampilkan <span className='font-bold text-blue-600 dark:text-blue-400'>{payrollSummary.meta?.from}</span> sampai <span className='font-bold text-blue-600 dark:text-blue-400'>{payrollSummary.meta?.to}</span> dari <span className='font-bold text-blue-600 dark:text-blue-400'>{payrollSummary.meta?.total}</span> data
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
