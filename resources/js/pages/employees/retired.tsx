import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowBigLeftIcon, ArrowBigRight, Pencil, PlusCircle, Trash2, Loader2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Eye, FileSpreadsheet, FileText, UserCheck, RotateCw, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { useDebounceSearch } from '@/hooks/use-debounce-search';
import { useCan } from '@/hooks/useCan';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import employees, { index, permanentDelete, restore } from '@/routes/employees';
import type { BreadcrumbItem } from '@/types';
import retired from '@/routes/employees/retired';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Karyawan',
        href: employees.index().url
    },
    {
        title: 'Karyawan Resign',
        href: retired.index().url
    }
];

interface Employee {
    id: number;
    nip: string;
    nama: string;
    kantorCabang?: { id: number; name: string };
    jabatan?: { id: number; name: string };
    nomor_rekening?: string;
    status_pegawai?: string;
    tanggal_mulai_kerja: string;
    ptkp?: string;
    gaji_pokok: number;
    tunjangan_jabatan: number;
    potongan_tidak_masuk: number;
    potongan_terlambat: number;
    total_gaji: number;
    total_potongan: number;
    deleted_at: string;
    user?: {
        id: number;
        name: string;
        username: string;
        email?: string;
    };
}

interface KantorCabang {
    id: number;
    name: string;
}

interface Jabatan {
    id: number;
    name: string;
}

interface RetiredPageProps {
    employees: EmployeeList;
    kantorCabang: KantorCabang[];
    jabatan: Jabatan[];
}

interface EmployeeList {
    data: Employee[];
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

export default function RetiredEmployeeIndex({ employees, kantorCabang, jabatan }: RetiredPageProps) {
    const { debouncedSearch, getSearchValue, isSearching, resetSearch } = useDebounceSearch();
    const can = useCan();
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.is_super_admin ?? false;
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    // Get current sort params from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentSortField = urlParams.get('sortField') || 'nama';
    const currentSortDirection = urlParams.get('sortDirection') || 'asc';
    const currentPerPage = urlParams.get('perPage') || '10';

    const handlePerPageChange = (value: string) => {
        router.get(retired.index().url, {
            ...Object.fromEntries(urlParams),
            perPage: value,
            page: '1',
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string) => {
        let direction = 'asc';

        if (currentSortField === field) {
            direction = currentSortDirection === 'asc' ? 'desc' : 'asc';
        }

        router.get(retired.index().url, {
            ...Object.fromEntries(urlParams),
            sortField: field,
            sortDirection: direction,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getSortIcon = (field: string) => {
        if (currentSortField !== field) {
            return <ArrowUpDown className="size-4 opacity-50" />;
        }
        return currentSortDirection === 'asc'
            ? <ArrowUp className="size-4" />
            : <ArrowDown className="size-4" />;
    };

    const buildUrl = (page: number) => {
        const params = new URLSearchParams();
        params.set('page', page.toString());

        if (currentSortField) params.set('sortField', currentSortField);
        if (currentSortDirection) params.set('sortDirection', currentSortDirection);
        if (currentPerPage) params.set('perPage', currentPerPage);

        const searchNama = getSearchValue('searchNama');
        const searchNIP = getSearchValue('searchNIP');
        const searchKantorCabang = getSearchValue('searchKantorCabang');
        const searchJabatan = getSearchValue('searchJabatan');
        if (searchNama) params.set('searchNama', searchNama);
        if (searchNIP) params.set('searchNIP', searchNIP);
        if (searchKantorCabang) params.set('searchKantorCabang', searchKantorCabang);
        if (searchJabatan) params.set('searchJabatan', searchJabatan);

        return `?${params.toString()}`;
    };

    const handleRestore = (employeeId: number, employeeName: string) => {
        Swal.fire({
            title: 'Aktifkan Kembali Karyawan?',
            text: `Apakah Anda yakin ingin mengaktifkan kembali karyawan "${employeeName}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, aktifkan!',
            cancelButtonText: 'Batal',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return router.post(restore(employeeId).url, {}, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Berhasil!',
                            text: `Karyawan "${employeeName}" berhasil diaktifkan kembali.`,
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            title: 'Gagal!',
                            text: 'Gagal mengaktifkan karyawan.',
                            icon: 'error',
                            confirmButtonColor: '#3b82f6',
                        });
                    }
                });
            }
        });
    };

    const handlePermanentDelete = (employeeId: number, employeeName: string) => {
        Swal.fire({
            title: 'Hapus Permanen Karyawan?',
            text: `Apakah Anda yakin ingin menghapus "${employeeName}" secara permanen? Tindakan ini tidak dapat dibatalkan!`,
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, hapus permanen!',
            cancelButtonText: 'Batal',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return router.delete(permanentDelete(employeeId).url, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Terhapus!',
                            text: `Karyawan "${employeeName}" berhasil dihapus permanen.`,
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            title: 'Gagal!',
                            text: 'Gagal menghapus karyawan.',
                            icon: 'error',
                            confirmButtonColor: '#3b82f6',
                        });
                    }
                });
            }
        });
    };

    const handleResetSearch = () => {
        resetSearch();
        router.get(retired.index().url, {}, {
            preserveState: false,
            preserveScroll: false,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Karyawan Resign" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent dark:from-red-400 dark:to-red-300'>
                            Karyawan Resign
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Kelola data karyawan yang telah Resign</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={index().url}
                            className='inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-500 dark:hover:from-red-700 dark:hover:to-red-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-red-500/30 dark:shadow-red-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105 active:scale-95'
                        >
                            <ArrowBigLeftIcon className='size-5' />
                            <span>Kembali ke Karyawan</span>
                        </Link>
                    </div>
                </div>

                {/* Table Card */}
                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-red-100 dark:shadow-none">

                    <div className="flex justify-between">

                        {/* Show Data Per Page */}
                        <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tampilkan:
                                </label>
                                <select
                                    value={currentPerPage}
                                    onChange={(e) => handlePerPageChange(e.target.value)}
                                    className="border-2 border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-900"
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <span className="text-sm text-gray-600 dark:text-gray-400">data per halaman</span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className='w-full min-w-[600px]'>
                            <thead className='bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800'>
                                <tr>
                                    <th className='rounded-tl-2xl w-16 px-4 py-4 text-left text-sm font-bold text-white w-12'>#</th>
                                    <th className='px-4 py-4 w-55 text-left text-sm font-bold text-white'>
                                        <button
                                            onClick={() => handleSort('nama')}
                                            className='flex items-center gap-2 hover:text-red-100 transition-colors cursor-pointer'
                                        >
                                            Nama
                                            <span className='ml-1'>{getSortIcon('nama')}</span>
                                        </button>
                                    </th>
                                    <th className='px-4 py-4 w-55 text-left text-sm font-bold text-white'>
                                        <button
                                            onClick={() => handleSort('nip')}
                                            className='flex items-center gap-2 hover:text-red-100 transition-colors cursor-pointer'
                                        >
                                            NIP
                                            <span className='ml-1'>{getSortIcon('nip')}</span>
                                        </button>
                                    </th>
                                    <th
                                        onClick={() => handleSort('kantorCabang')}
                                        className='px-4 py-4 text-left text-sm font-bold text-white cursor-pointer hover:text-red-100'>
                                        <button className='flex items-center gap-2'>
                                            Cabang
                                            <span className='ml-1'>{getSortIcon('kantorCabang')}</span>
                                        </button>
                                    </th>
                                    <th
                                        onClick={() => handleSort('jabatan')}
                                        className='px-4 py-4 text-left text-sm font-bold text-white cursor-pointer hover:text-red-100'>
                                        <button className='flex items-center gap-2'>
                                            Jabatan
                                            <span className='ml-1'>{getSortIcon('jabatan')}</span>
                                        </button>
                                    </th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>Tanggal Resign</th>
                                    <th className='rounded-tr-2xl px-4 py-4 text-center text-sm font-bold text-white w-40'>Aksi</th>
                                </tr>
                            </thead>

                            {/* Search Row */}
                            <thead className='bg-sky-50 dark:bg-gray-800/50'>
                                <tr>
                                    <th className='px-4 py-4'></th>
                                    <th className='px-4 py-4'>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className='w-full border-2 border-sky-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-900 transition-colors'
                                                value={getSearchValue('searchNama')}
                                                onChange={(e) => debouncedSearch('searchNama', e.target.value, retired.index().url)}
                                                placeholder='Cari nama...'
                                            />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sky-400">
                                                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </th>
                                    <th className='px-4 py-4'>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className='w-full border-2 border-sky-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-900 transition-colors'
                                                placeholder='Cari NIP...'
                                                value={getSearchValue('searchNIP')}
                                                onChange={(e) => debouncedSearch('searchNIP', e.target.value, retired.index().url)}
                                            />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sky-400">
                                                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </th>
                                    <th className='px-4 py-4'>
                                        <select
                                            className='w-full border-2 border-sky-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-900 transition-colors'
                                            value={getSearchValue('searchKantorCabang') || ''}
                                            onChange={(e) => debouncedSearch('searchKantorCabang', e.target.value, retired.index().url)}
                                        >
                                            <option value="">Semua</option>
                                            {kantorCabang.map((cab) => (
                                                <option key={cab.id} value={cab.name}>{cab.name}</option>
                                            ))}
                                        </select>
                                    </th>
                                    <th className='px-4 py-4'>
                                        <select
                                            className='w-full border-2 border-sky-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-900 transition-colors'
                                            value={getSearchValue('searchJabatan') || ''}
                                            onChange={(e) => debouncedSearch('searchJabatan', e.target.value, retired.index().url)}
                                        >
                                            <option value="">Semua</option>
                                            {jabatan.map((jab) => (
                                                <option key={jab.id} value={jab.name}>{jab.name}</option>
                                            ))}
                                        </select>
                                    </th>
                                    <th className='px-4 py-4'></th>
                                    <th className='px-4 py-4'>
                                        {(getSearchValue('searchNama') || getSearchValue('searchNIP') || getSearchValue('searchKantorCabang') || getSearchValue('searchJabatan')) && (
                                            <button
                                                onClick={handleResetSearch}
                                                className="inline-flex items-center gap-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-medium px-3 py-2 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 text-sm"
                                                title="Reset pencarian"
                                            >
                                                <RotateCcw className='size-4' />
                                                <span>Reset</span>
                                            </button>
                                        )}
                                    </th>
                                </tr>
                            </thead>

                            <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                                {isSearching ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="relative">
                                                    <div className="size-12 rounded-full border-4 border-sky-200 dark:border-gray-700"></div>
                                                    <Loader2 className="absolute top-0 left-0 size-12 animate-spin text-sky-500 dark:text-sky-400" />
                                                </div>
                                                <span className="text-muted-foreground font-medium">Mencari data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : !employees?.data || employees.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="size-16 rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
                                                    <UserCheck className="size-8 text-sky-500 dark:text-sky-400" />
                                                </div>
                                                <p className="text-muted-foreground font-medium">Tidak ada karyawan Resign</p>
                                                <p className="text-sm text-muted-foreground">Data karyawan yang diResignkan akan muncul di sini</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    employees.data.map((employee, index) => (
                                        <tr key={employee.id} className="hover:bg-sky-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center size-7 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/30 dark:to-sky-800/30 text-sky-600 dark:text-sky-400 font-bold text-xs">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900 dark:text-white text-sm">{employee.nama}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <code className="rounded bg-sky-100 dark:bg-sky-900/30 px-2 py-1 text-xs font-medium text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                                                    {employee.nip}
                                                </code>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                                    {employee.kantorCabang?.name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                                    {employee.jabatan?.name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {employee.deleted_at ? formatDate(employee.deleted_at) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => setSelectedEmployee(employee)}
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95"
                                                        title="Detail"
                                                    >
                                                        <Eye className="size-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRestore(employee.id, employee.nama)}
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/30 hover:scale-105 active:scale-95"
                                                        title="Aktifkan Kembali"
                                                    >
                                                        <RotateCw className="size-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePermanentDelete(employee.id, employee.nama)}
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95"
                                                        title="Hapus Permanen"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {employees?.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-sky-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800">
                            {/* Info Data */}
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Menampilkan <span className='font-bold text-sky-600 dark:text-sky-400'>{employees.meta.from}</span> sampai <span className='font-bold text-sky-600 dark:text-sky-400'>{employees.meta.to}</span> dari <span className='font-bold text-sky-600 dark:text-sky-400'>{employees.meta.total}</span> data
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href={buildUrl(1)}
                                    className={employees.meta.current_page === 1
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-4 py-2 text-sm font-medium'
                                        : 'inline-flex items-center gap-1 border-2 border-sky-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 transition-all duration-200'
                                    }
                                >
                                    <span>Awal</span>
                                </Link>

                                <Link
                                    href={employees.links.prev ? buildUrl(employees.meta.current_page - 1) : '#'}
                                    className={!employees.links.prev
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-3 py-2'
                                        : 'inline-flex items-center border-2 border-sky-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 transition-all duration-200'
                                    }
                                >
                                    <ArrowBigLeftIcon className="size-4" />
                                </Link>

                                {Array.from({ length: Math.min(employees.meta.last_page, 5) }, (_, i) => {
                                    let pageNum;
                                    if (employees.meta.last_page <= 5) {
                                        pageNum = i + 1;
                                    } else if (employees.meta.current_page <= 3) {
                                        pageNum = i + 1;
                                    } else if (employees.meta.current_page >= employees.meta.last_page - 2) {
                                        pageNum = employees.meta.last_page - 4 + i;
                                    } else {
                                        pageNum = employees.meta.current_page - 2 + i;
                                    }

                                    return (
                                        <Link
                                            key={pageNum}
                                            href={buildUrl(pageNum)}
                                            className={`min-w-[2.5rem] h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 ${pageNum === employees.meta.current_page
                                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30'
                                                : 'border-2 border-sky-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-sky-100 dark:hover:bg-gray-700 hover:border-red-400 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            {pageNum}
                                        </Link>
                                    );
                                })}

                                <Link
                                    href={employees.links.next ? buildUrl(employees.meta.current_page + 1) : '#'}
                                    className={!employees.links.next
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-3 py-2'
                                        : 'inline-flex items-center border-2 border-sky-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 transition-all duration-200'
                                    }
                                >
                                    <ArrowBigRight className="size-4" />
                                </Link>

                                <Link
                                    href={buildUrl(employees.meta.last_page)}
                                    className={employees.meta.current_page === employees.meta.last_page
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-4 py-2 text-sm font-medium'
                                        : 'inline-flex items-center gap-1 border-2 border-sky-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 transition-all duration-200'
                                    }
                                >
                                    <span>Akhir</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detail Karyawan Resign</h3>
                            <button
                                onClick={() => setSelectedEmployee(null)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">NIP</label>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{selectedEmployee.nip}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nama</label>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{selectedEmployee.nama}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cabang</label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedEmployee.kantorCabang?.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Jabatan</label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedEmployee.jabatan?.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tanggal Mulai Kerja</label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedEmployee.tanggal_mulai_kerja)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tanggal Resign</label>
                                    <p className="mt-1 text-sm text-sky-600 dark:text-sky-400 font-semibold">{selectedEmployee.deleted_at ? formatDate(selectedEmployee.deleted_at) : '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gaji Pokok</label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatCurrency(selectedEmployee.gaji_pokok)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tunjangan Jabatan</label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatCurrency(selectedEmployee.tunjangan_jabatan)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Gaji</label>
                                    <p className="mt-1 text-sm font-semibold text-sky-600 dark:text-sky-400">{formatCurrency(selectedEmployee.total_gaji)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                    <p className="mt-1">
                                        <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                            Resign
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                            <button
                                onClick={() => setSelectedEmployee(null)}
                                className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={() => handleRestore(selectedEmployee.id, selectedEmployee.nama)}
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/30 hover:scale-105 active:scale-95"
                            >
                                <RotateCw className="size-4" />
                                Aktifkan Kembali
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
