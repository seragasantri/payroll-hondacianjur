import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowBigLeftIcon, ArrowBigRight, Pencil, PlusCircle, Trash2, Loader2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Swal from 'sweetalert2';
import { useDebounceSearch } from '@/hooks/use-debounce-search';
import { useCan } from '@/hooks/useCan';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { create, destroy, edit, index } from '@/routes/employees';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Karyawan',
        href: index().url
    }
];

interface Employee {
    id: number;
    nip: string;
    nama: string;
    divisi: string;
    jabatan: string;
    tanggal_mulai_kerja: string;
    gaji_pokok: number;
    tunjangan_jabatan: number;
    potongan_tidak_masuk: number;
    potongan_terlambat: number;
    total_gaji: number;
    total_potongan: number;
    gaji_bersih: number;
    user?: {
        id: number;
        name: string;
        username: string;
        email?: string;
    };
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

export default function EmployeeIndex({ employees }: { employees: EmployeeList }) {
    const { debouncedSearch, getSearchValue, isSearching, resetSearch } = useDebounceSearch();
    const can = useCan();
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.is_super_admin ?? false;

    // Cek apakah user punya aksi (edit atau delete)
    const hasActionAccess = isSuperAdmin || can('employees.edit') || can('employees.delete');

    // Get current sort params from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentSortField = urlParams.get('sortField') || 'nama';
    const currentSortDirection = urlParams.get('sortDirection') || 'asc';

    const handleSort = (field: string) => {
        let direction = 'asc';

        // If already sorting by this field, toggle direction
        if (currentSortField === field) {
            direction = currentSortDirection === 'asc' ? 'desc' : 'asc';
        }

        router.get(index().url, {
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

        const searchNama = getSearchValue('searchNama');
        const searchNIP = getSearchValue('searchNIP');
        const searchDivisi = getSearchValue('searchDivisi');
        if (searchNama) params.set('searchNama', searchNama);
        if (searchNIP) params.set('searchNIP', searchNIP);
        if (searchDivisi) params.set('searchDivisi', searchDivisi);

        return `?${params.toString()}`;
    };

    const handleDelete = (employeeId: number, employeeName: string) => {
        Swal.fire({
            title: 'Hapus Karyawan?',
            text: `Apakah Anda yakin ingin menghapus karyawan "${employeeName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return router.delete(destroy(employeeId).url, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Terhapus!',
                            text: `Karyawan "${employeeName}" berhasil dihapus.`,
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
        router.get(index().url, {}, {
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
            <Head title="Manajemen Karyawan" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent dark:from-orange-400 dark:to-orange-300'>
                            Manajemen Karyawan
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Kelola data karyawan dengan mudah</p>
                    </div>
                    <div className="flex items-center gap-3">

                        {(isSuperAdmin || can('employees.create')) && (
                            <Link
                                href={create().url}
                                className='inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-500 dark:hover:from-orange-700 dark:hover:to-orange-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 dark:shadow-orange-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95'
                            >
                                <PlusCircle className='size-5' />
                                <span>Tambah Karyawan</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Table Card */}
                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-orange-100 dark:shadow-none">

                    <div className="overflow-x-auto">
                    <table className='w-full min-w-[1800px]'>
                        <thead className='bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800'>
                            <tr>
                                <th className='rounded-tl-2xl px-4 py-4 text-left text-sm font-bold text-white w-12'>#</th>
                                <th className='px-4 py-4 text-left text-sm font-bold text-white'>
                                    <button
                                        onClick={() => handleSort('nama')}
                                        className='flex items-center gap-2 hover:text-orange-100 transition-colors cursor-pointer'
                                    >
                                        Nama
                                        <span className='ml-1'>{getSortIcon('nama')}</span>
                                    </button>
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-bold text-white'>
                                    <button
                                        onClick={() => handleSort('nip')}
                                        className='flex items-center gap-2 hover:text-orange-100 transition-colors cursor-pointer'
                                    >
                                        NIP
                                        <span className='ml-1'>{getSortIcon('nip')}</span>
                                    </button>
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-bold text-white'>
                                    <button
                                        onClick={() => handleSort('divisi')}
                                        className='flex items-center gap-2 hover:text-orange-100 transition-colors cursor-pointer'
                                    >
                                        Divisi
                                        <span className='ml-1'>{getSortIcon('divisi')}</span>
                                    </button>
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-bold text-white'>
                                    <button
                                        onClick={() => handleSort('jabatan')}
                                        className='flex items-center gap-2 hover:text-orange-100 transition-colors cursor-pointer'
                                    >
                                        Jabatan
                                        <span className='ml-1'>{getSortIcon('jabatan')}</span>
                                    </button>
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-bold text-white'>Tgl Mulai</th>
                                <th className='px-3 py-4 text-right text-sm font-bold text-white'>Gaji Pokok</th>
                                <th className='px-3 py-4 text-right text-sm font-bold text-white'>Tunjangan</th>
                                <th className='px-3 py-4 text-right text-sm font-bold text-white'>Total Gaji</th>
                                <th className='px-3 py-4 text-right text-sm font-bold text-white'>Pot. Tidak Masuk</th>
                                <th className='px-3 py-4 text-right text-sm font-bold text-white'>Pot. Terlambat</th>
                                <th className='px-3 py-4 text-right text-sm font-bold text-white'>Total Pot.</th>
                                <th className='px-4 py-4 text-right text-sm font-bold text-white'>Gaji Bersih</th>
                                {hasActionAccess && (
                                    <th className='rounded-tr-2xl px-4 py-4 text-center text-sm font-bold text-white w-28'>Aksi</th>
                                )}
                            </tr>
                        </thead>

                        {/* Search Row */}
                        <thead className='bg-orange-50 dark:bg-gray-800/50'>
                            <tr>
                                <th className='px-4 py-4'></th>
                                <th className='px-4 py-4'>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className='w-full border-2 border-orange-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 bg-white dark:bg-gray-900 transition-colors'
                                            value={getSearchValue('searchNama')}
                                            onChange={(e) => debouncedSearch('searchNama', e.target.value, index().url)}
                                            placeholder='Cari nama...'
                                        />
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-orange-400">
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
                                            className='w-full border-2 border-orange-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 bg-white dark:bg-gray-900 transition-colors'
                                            placeholder='Cari NIP...'
                                            value={getSearchValue('searchNIP')}
                                            onChange={(e) => debouncedSearch('searchNIP', e.target.value, index().url)}
                                        />
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-orange-400">
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
                                            className='w-full border-2 border-orange-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 bg-white dark:bg-gray-900 transition-colors'
                                            placeholder='Cari divisi...'
                                            value={getSearchValue('searchDivisi')}
                                            onChange={(e) => debouncedSearch('searchDivisi', e.target.value, index().url)}
                                        />
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-orange-400">
                                            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </th>
                                <th className='px-4 py-4' colSpan={hasActionAccess ? 10 : 9}></th>
                                {hasActionAccess && (
                                    <th className='px-4 py-4'>
                                        {(getSearchValue('searchNama') || getSearchValue('searchNIP') || getSearchValue('searchDivisi')) && (
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
                                )}
                            </tr>
                        </thead>

                        <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                            {isSearching ? (
                                <tr>
                                    <td colSpan={hasActionAccess ? 14 : 13} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="relative">
                                                <div className="size-12 rounded-full border-4 border-orange-200 dark:border-gray-700"></div>
                                                <Loader2 className="absolute top-0 left-0 size-12 animate-spin text-orange-500 dark:text-orange-400" />
                                            </div>
                                            <span className="text-muted-foreground font-medium">Mencari data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : !employees?.data || employees.data.length === 0 ? (
                                <tr>
                                    <td colSpan={hasActionAccess ? 14 : 13} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="size-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                                <svg className="size-8 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-muted-foreground font-medium">Data tidak ditemukan</p>
                                            <p className="text-sm text-muted-foreground">Coba kata kunci pencarian lain</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                employees.data.map((employee, index) => (
                                    <tr key={employee.id} className="hover:bg-orange-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center justify-center size-7 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-600 dark:text-orange-400 font-bold text-xs">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{employee.nama}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <code className="rounded bg-orange-100 dark:bg-orange-900/30 px-2 py-1 text-xs font-medium text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                                {employee.nip}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                {employee.divisi}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                                {employee.jabatan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {formatDate(employee.tanggal_mulai_kerja)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {formatCurrency(employee.gaji_pokok)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {formatCurrency(employee.tunjangan_jabatan)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                                            {formatCurrency(employee.total_gaji)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-medium text-red-600 dark:text-red-400">
                                            {formatCurrency(employee.potongan_tidak_masuk)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-medium text-red-600 dark:text-red-400">
                                            {formatCurrency(employee.potongan_terlambat)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20">
                                            {formatCurrency(employee.total_potongan)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">
                                            {formatCurrency(employee.gaji_bersih)}
                                        </td>
                                        {hasActionAccess && (
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {(isSuperAdmin || can('employees.edit')) && (
                                                        <Link
                                                            href={edit(employee.id).url}
                                                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-amber-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 active:scale-95"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="size-3" />
                                                        </Link>
                                                    )}
                                                    {(isSuperAdmin || can('employees.delete')) && (
                                                        <button
                                                            onClick={() => handleDelete(employee.id, employee.nama)}
                                                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>

                    {/* Pagination */}
                    {employees?.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-orange-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800">
                            {/* Info Data */}
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Menampilkan <span className='font-bold text-orange-600 dark:text-orange-400'>{employees.meta.from}</span> sampai <span className='font-bold text-orange-600 dark:text-orange-400'>{employees.meta.to}</span> dari <span className='font-bold text-orange-600 dark:text-orange-400'>{employees.meta.total}</span> data
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href={buildUrl(1)}
                                    className={employees.meta.current_page === 1
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-4 py-2 text-sm font-medium'
                                        : 'inline-flex items-center gap-1 border-2 border-orange-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:hover:bg-orange-600 dark:hover:border-orange-600 transition-all duration-200'
                                    }
                                >
                                    <span>Awal</span>
                                </Link>

                                <Link
                                    href={employees.links.prev ? buildUrl(employees.meta.current_page - 1) : '#'}
                                    className={!employees.links.prev
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-3 py-2'
                                        : 'inline-flex items-center border-2 border-orange-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:hover:bg-orange-600 dark:hover:border-orange-600 transition-all duration-200'
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
                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30'
                                                : 'border-2 border-orange-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700 hover:border-orange-400 dark:hover:border-gray-600'
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
                                        : 'inline-flex items-center border-2 border-orange-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:hover:bg-orange-600 dark:hover:border-orange-600 transition-all duration-200'
                                    }
                                >
                                    <ArrowBigRight className="size-4" />
                                </Link>

                                <Link
                                    href={buildUrl(employees.meta.last_page)}
                                    className={employees.meta.current_page === employees.meta.last_page
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-4 py-2 text-sm font-medium'
                                        : 'inline-flex items-center gap-1 border-2 border-orange-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:hover:bg-orange-600 dark:hover:border-orange-600 transition-all duration-200'
                                    }
                                >
                                    <span>Akhir</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
