import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowBigLeftIcon, ArrowBigRight, Pencil, PlusCircle, Trash2, Loader2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Swal from 'sweetalert2';
import { useDebounceSearch } from '@/hooks/use-debounce-search';
import { useCan } from '@/hooks/useCan';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface Jabatan {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

interface JabatanList {
    data: Jabatan[];
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
        title: 'Jabatan',
        href: '#'
    }
];

export default function JabatanIndex({ jabatan }: { jabatan: JabatanList }) {
    const { debouncedSearch, getSearchValue, isSearching, resetSearch } = useDebounceSearch();
    const can = useCan();
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.is_super_admin ?? false;

    // Cek apakah user punya aksi (edit atau delete)
    const hasActionAccess = isSuperAdmin || can('jabatan.edit') || can('jabatan.delete');

    // Get current sort params from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentSortField = urlParams.get('sortField') || 'name';
    const currentSortDirection = urlParams.get('sortDirection') || 'asc';
    const currentPerPage = urlParams.get('perPage') || '10';

    const jabatanIndex = () => ({
        url: '/jabatan',
    });

    const jabatanCreate = () => ({
        url: '/jabatan/create',
    });

    const jabatanEdit = (id: number) => ({
        url: `/jabatan/${id}/edit`,
    });

    const jabatanDestroy = (id: number) => ({
        url: `/jabatan/${id}`,
    });

    const handlePerPageChange = (value: string) => {
        router.get(jabatanIndex().url, {
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

        router.get(jabatanIndex().url, {
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

        const searchName = getSearchValue('searchName');
        if (searchName) params.set('searchName', searchName);

        return `?${params.toString()}`;
    };

    const handleDelete = (jabatanId: number, jabatanName: string) => {
        Swal.fire({
            title: 'Hapus Jabatan?',
            text: `Apakah Anda yakin ingin menghapus jabatan "${jabatanName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return router.delete(jabatanDestroy(jabatanId).url, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Terhapus!',
                            text: `Jabatan "${jabatanName}" berhasil dihapus.`,
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            title: 'Gagal!',
                            text: 'Gagal menghapus jabatan.',
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
        router.get(jabatanIndex().url, {}, {
            preserveState: false,
            preserveScroll: false,
        });
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
            <Head title="Manajemen Jabatan" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent dark:from-red-400 dark:to-red-300'>
                            Manajemen Jabatan
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Kelola data jabatan dengan mudah</p>
                    </div>
                    <div className="flex items-center gap-3">

                        {(isSuperAdmin || can('jabatan.create')) && (
                            <Link
                                href={jabatanCreate().url}
                                className='inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-500 dark:hover:from-red-700 dark:hover:to-red-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-red-500/30 dark:shadow-red-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105 active:scale-95'
                            >
                                <PlusCircle className='size-5' />
                                <span>Tambah Jabatan</span>
                            </Link>
                        )}
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
                        <table className='w-full min-w-[800px]'>
                            <thead className='bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800'>
                                <tr>
                                    <th className='rounded-tl-2xl px-4 py-4 text-left text-sm font-bold text-white w-12'>#</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>
                                        <button
                                            onClick={() => handleSort('name')}
                                            className='flex items-center gap-2 hover:text-sky-100 transition-colors cursor-pointer'
                                        >
                                            Nama Jabatan
                                            <span className='ml-1'>{getSortIcon('name')}</span>
                                        </button>
                                    </th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>Tanggal Dibuat</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>Terakhir Diupdate</th>
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
                                                value={getSearchValue('searchName')}
                                                onChange={(e) => debouncedSearch('searchName', e.target.value, jabatanIndex().url)}
                                                placeholder='Cari jabatan...'
                                            />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sky-400">
                                                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </th>
                                    <th className='px-4 py-4' colSpan={hasActionAccess ? 2 : 1}></th>
                                    {hasActionAccess && (
                                        <th className='px-4 py-4'>
                                            {getSearchValue('searchName') && (
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
                                        <td colSpan={hasActionAccess ? 5 : 4} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="relative">
                                                    <div className="size-12 rounded-full border-4 border-sky-200 dark:border-gray-700"></div>
                                                    <Loader2 className="absolute top-0 left-0 size-12 animate-spin text-red-500 dark:text-sky-400" />
                                                </div>
                                                <span className="text-muted-foreground font-medium">Mencari data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : !jabatan?.data || jabatan.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={hasActionAccess ? 5 : 4} className="px-4 py-12 text-center">
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
                                    jabatan.data.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-sky-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center size-7 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/30 dark:to-sky-800/30 text-sky-600 dark:text-sky-400 font-bold text-xs">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {formatDate(item.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {formatDate(item.updated_at)}
                                            </td>
                                            {hasActionAccess && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {(isSuperAdmin || can('jabatan.edit')) && (
                                                            <Link
                                                                href={jabatanEdit(item.id).url}
                                                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/30 hover:scale-105 active:scale-95"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="size-3" />
                                                            </Link>
                                                        )}
                                                        {(isSuperAdmin || can('jabatan.delete')) && (
                                                            <button
                                                                onClick={() => handleDelete(item.id, item.name)}
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
                    {jabatan?.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-sky-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800">
                            {/* Info Data */}
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Menampilkan <span className='font-bold text-sky-600 dark:text-sky-400'>{jabatan.meta.from}</span> sampai <span className='font-bold text-sky-600 dark:text-sky-400'>{jabatan.meta.to}</span> dari <span className='font-bold text-sky-600 dark:text-sky-400'>{jabatan.meta.total}</span> data
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href={buildUrl(1)}
                                    className={jabatan.meta.current_page === 1
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-4 py-2 text-sm font-medium'
                                        : 'inline-flex items-center gap-1 border-2 border-sky-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 transition-all duration-200'
                                    }
                                >
                                    <span>Awal</span>
                                </Link>

                                <Link
                                    href={jabatan.links.prev ? buildUrl(jabatan.meta.current_page - 1) : '#'}
                                    className={!jabatan.links.prev
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-3 py-2'
                                        : 'inline-flex items-center border-2 border-sky-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 transition-all duration-200'
                                    }
                                >
                                    <ArrowBigLeftIcon className="size-4" />
                                </Link>

                                {Array.from({ length: Math.min(jabatan.meta.last_page, 5) }, (_, i) => {
                                    let pageNum;
                                    if (jabatan.meta.last_page <= 5) {
                                        pageNum = i + 1;
                                    } else if (jabatan.meta.current_page <= 3) {
                                        pageNum = i + 1;
                                    } else if (jabatan.meta.current_page >= jabatan.meta.last_page - 2) {
                                        pageNum = jabatan.meta.last_page - 4 + i;
                                    } else {
                                        pageNum = jabatan.meta.current_page - 2 + i;
                                    }

                                    return (
                                        <Link
                                            key={pageNum}
                                            href={buildUrl(pageNum)}
                                            className={`min-w-[2.5rem] h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 ${pageNum === jabatan.meta.current_page
                                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30'
                                                : 'border-2 border-sky-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-sky-100 dark:hover:bg-gray-700 hover:border-sky-400 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            {pageNum}
                                        </Link>
                                    );
                                })}

                                <Link
                                    href={jabatan.links.next ? buildUrl(jabatan.meta.current_page + 1) : '#'}
                                    className={!jabatan.links.next
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-3 py-2'
                                        : 'inline-flex items-center border-2 border-sky-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 transition-all duration-200'
                                    }
                                >
                                    <ArrowBigRight className="size-4" />
                                </Link>

                                <Link
                                    href={buildUrl(jabatan.meta.last_page)}
                                    className={jabatan.meta.current_page === jabatan.meta.last_page
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
