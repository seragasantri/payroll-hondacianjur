import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowBigLeftIcon, ArrowBigRight, Pencil, PlusCircle, Trash2, Loader2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Swal from 'sweetalert2';
import { useDebounceSearch } from '@/hooks/use-debounce-search';
import { useCan } from '@/hooks/useCan';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { create, destroy, edit, index } from '@/routes/tunjangan';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Tunjangan',
        href: index().url
    }
];

interface Tunjangan {
    id: number;
    jenis_tunjangan: string;
    perusahaan: number;
    karyawan: number;
    total: number;
    created_at: string;
    updated_at: string;
}

interface TunjanganList {
    data: Tunjangan[];
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

export default function TunjanganIndex({ tunjangan }: { tunjangan: TunjanganList }) {
    const { debouncedSearch, getSearchValue, isSearching, resetSearch } = useDebounceSearch();
    const can = useCan();
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.is_super_admin ?? false;

    // Cek apakah user punya aksi (edit atau delete)
    const hasActionAccess = isSuperAdmin || can('tunjangan.edit') || can('tunjangan.delete');

    // Get current sort params from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentSortField = urlParams.get('sortField') || 'jenis_tunjangan';
    const currentSortDirection = urlParams.get('sortDirection') || 'asc';
    const currentPerPage = urlParams.get('perPage') || '10';

    const handlePerPageChange = (value: string) => {
        router.get(index().url, {
            ...Object.fromEntries(urlParams),
            perPage: value,
            page: '1', // Reset to page 1 when changing per page
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

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
        if (currentPerPage) params.set('perPage', currentPerPage);

        const searchJenis = getSearchValue('searchJenis');
        if (searchJenis) params.set('searchJenis', searchJenis);

        return `?${params.toString()}`;
    };

    const handleDelete = (tunjanganId: number, jenisTunjangan: string) => {
        Swal.fire({
            title: 'Hapus Tunjangan?',
            text: `Apakah Anda yakin ingin menghapus Tunjangan "${jenisTunjangan}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return router.delete(destroy(tunjanganId).url, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Terhapus!',
                            text: `Tunjangan "${jenisTunjangan}" berhasil dihapus.`,
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            title: 'Gagal!',
                            text: 'Gagal menghapus Tunjangan.',
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

    const formatPercentage = (value: number) => {
        return `${value.toFixed(2)}%`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Tunjangan" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent dark:from-red-400 dark:to-red-300'>
                            Manajemen Tunjangan
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Kelola data Tunjangan dengan mudah</p>
                    </div>
                    <div className="flex items-center gap-3">
                    </div>
                </div>

                {/* Table Card */}
                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-sky-100 dark:shadow-none">

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

                    <div className="overflow-x-auto">
                        <table className='w-full min-w-[900px]'>
                            <thead className='bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800'>
                                <tr>
                                    <th className='rounded-tl-2xl px-4 py-4 text-left text-sm font-bold text-white w-12'>#</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>
                                        <button
                                            onClick={() => handleSort('jenis_tunjangan')}
                                            className='flex items-center gap-2 hover:text-sky-100 transition-colors cursor-pointer'
                                        >
                                            Jenis Tunjangan
                                            <span className='ml-1'>{getSortIcon('jenis_tunjangan')}</span>
                                        </button>
                                    </th>
                                    <th className='px-4 py-4 text-right text-sm font-bold text-white'>Perusahaan</th>
                                    <th className='px-4 py-4 text-right text-sm font-bold text-white'>Karyawan</th>
                                    <th className='px-4 py-4 text-right text-sm font-bold text-white'>Total</th>
                                    {hasActionAccess && (
                                        <th className='rounded-tr-2xl px-4 py-4 text-center text-sm font-bold text-white w-28'>Aksi</th>
                                    )}
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
                                                value={getSearchValue('searchJenis')}
                                                onChange={(e) => debouncedSearch('searchJenis', e.target.value, index().url)}
                                                placeholder='Cari jenis Tunjangan...'
                                            />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sky-400">
                                                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </th>
                                    <th className='px-4 py-4' colSpan={hasActionAccess ? 4 : 3}></th>
                                    {hasActionAccess && (
                                        <th className='px-4 py-4'>
                                            {(getSearchValue('searchJenis')) && (
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
                                        <td colSpan={hasActionAccess ? 6 : 5} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="relative">
                                                    <div className="size-12 rounded-full border-4 border-sky-200 dark:border-gray-700"></div>
                                                    <Loader2 className="absolute top-0 left-0 size-12 animate-spin text-red-500 dark:text-sky-400" />
                                                </div>
                                                <span className="text-muted-foreground font-medium">Mencari data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : !tunjangan?.data || tunjangan.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={hasActionAccess ? 6 : 5} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="size-16 rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
                                                    <svg className="size-8 text-red-500 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <p className="text-muted-foreground font-medium">Data tidak ditemukan</p>
                                                <p className="text-sm text-muted-foreground">Coba kata kunci pencarian lain</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    tunjangan.data.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-sky-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center size-7 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/30 dark:to-sky-800/30 text-sky-600 dark:text-sky-400 font-bold text-xs">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.jenis_tunjangan}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {formatPercentage(item.perusahaan)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {formatPercentage(item.karyawan)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20">
                                                {formatPercentage(item.total)}
                                            </td>
                                            {hasActionAccess && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {(isSuperAdmin || can('tunjangan.edit')) && (
                                                            <Link
                                                                href={edit(item.id).url}
                                                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/30 hover:scale-105 active:scale-95"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="size-3" />
                                                            </Link>
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
                    {tunjangan?.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-sky-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800">
                            {/* Info Data */}
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Menampilkan <span className='font-bold text-sky-600 dark:text-sky-400'>{tunjangan.meta.from}</span> sampai <span className='font-bold text-sky-600 dark:text-sky-400'>{tunjangan.meta.to}</span> dari <span className='font-bold text-sky-600 dark:text-sky-400'>{tunjangan.meta.total}</span> data
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href={buildUrl(1)}
                                    className={tunjangan.meta.current_page === 1
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-4 py-2 text-sm font-medium'
                                        : 'inline-flex items-center gap-1 border-2 border-sky-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 transition-all duration-200'
                                    }
                                >
                                    <span>Awal</span>
                                </Link>

                                <Link
                                    href={tunjangan.links.prev ? buildUrl(tunjangan.meta.current_page - 1) : '#'}
                                    className={!tunjangan.links.prev
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-3 py-2'
                                        : 'inline-flex items-center border-2 border-sky-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 transition-all duration-200'
                                    }
                                >
                                    <ArrowBigLeftIcon className="size-4" />
                                </Link>

                                {Array.from({ length: Math.min(tunjangan.meta.last_page, 5) }, (_, i) => {
                                    let pageNum;
                                    if (tunjangan.meta.last_page <= 5) {
                                        pageNum = i + 1;
                                    } else if (tunjangan.meta.current_page <= 3) {
                                        pageNum = i + 1;
                                    } else if (tunjangan.meta.current_page >= tunjangan.meta.last_page - 2) {
                                        pageNum = tunjangan.meta.last_page - 4 + i;
                                    } else {
                                        pageNum = tunjangan.meta.current_page - 2 + i;
                                    }

                                    return (
                                        <Link
                                            key={pageNum}
                                            href={buildUrl(pageNum)}
                                            className={`min-w-[2.5rem] h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 ${pageNum === tunjangan.meta.current_page
                                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30'
                                                : 'border-2 border-sky-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-sky-100 dark:hover:bg-gray-700 hover:border-sky-400 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            {pageNum}
                                        </Link>
                                    );
                                })}

                                <Link
                                    href={tunjangan.links.next ? buildUrl(tunjangan.meta.current_page + 1) : '#'}
                                    className={!tunjangan.links.next
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-3 py-2'
                                        : 'inline-flex items-center border-2 border-sky-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 transition-all duration-200'
                                    }
                                >
                                    <ArrowBigRight className="size-4" />
                                </Link>

                                <Link
                                    href={buildUrl(tunjangan.meta.last_page)}
                                    className={tunjangan.meta.current_page === tunjangan.meta.last_page
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
        </AppLayout>
    );
}
