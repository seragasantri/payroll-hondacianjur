import { Head, Link, router } from '@inertiajs/react';
import { ArrowBigLeftIcon, ArrowBigRight, Pencil, PlusCircle, Trash2, Loader2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Shield, Layers } from 'lucide-react';
import Swal from 'sweetalert2';
import { useDebounceSearch } from '@/hooks/use-debounce-search';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index, create, edit, destroy } from '@/routes/roles';
import type { BreadcrumbItem, RoleList } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Roles',
        href: index().url
    }
];

export default function RoleIndex({ roles }: { roles: RoleList }) {
    const { debouncedSearch, getSearchValue, isSearching, resetSearch } = useDebounceSearch();

    // Get current sort params from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentSortField = urlParams.get('sortField') || 'name';
    const currentSortDirection = urlParams.get('sortDirection') || 'asc';
    const currentPerPage = urlParams.get('perPage') || '10';

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

    const handlePerPageChange = (perPage: string) => {
        router.get(index().url, {
            ...Object.fromEntries(urlParams),
            perPage: perPage,
            page: '1',
        }, {
            preserveState: true,
            preserveScroll: false,
        });
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

    const handleDelete = (roleId: number, roleName: string) => {
        Swal.fire({
            title: 'Hapus Role?',
            text: `Apakah Anda yakin ingin menghapus role "${roleName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return router.delete(destroy(roleId).url, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Terhapus!',
                            text: `Role "${roleName}" berhasil dihapus.`,
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            title: 'Gagal!',
                            text: 'Gagal menghapus role.',
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Roles" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent dark:from-orange-400 dark:to-orange-300'>
                            Manajemen Roles
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Kelola data hak akses sistem dengan mudah</p>
                    </div>
                    <div className="flex items-center gap-3">

                        <Link
                            href={create().url}
                            className='inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-500 dark:hover:from-orange-700 dark:hover:to-orange-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 dark:shadow-orange-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95'
                        >
                            <PlusCircle className='size-5' />
                            <span>Tambah Role</span>
                        </Link>
                    </div>
                </div>

                {/* Table Card */}
                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-orange-100 dark:shadow-none">

                    {/* Per Page Selector */}
                    <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan:</label>
                            <select
                                value={currentPerPage}
                                onChange={(e) => handlePerPageChange(e.target.value)}
                                className="border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all"
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
                        <table className='w-full'>
                        <thead className='bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800'>
                            <tr>
                                <th className='rounded-tl-2xl px-6 py-4 text-left text-sm font-bold text-white'>#</th>
                                <th className='px-6 py-4 text-left text-sm font-bold text-white'>
                                    <button
                                        onClick={() => handleSort('name')}
                                        className='flex items-center gap-2 hover:text-orange-100 transition-colors cursor-pointer'
                                    >
                                        Nama Role
                                        <span className='ml-1'>{getSortIcon('name')}</span>
                                    </button>
                                </th>
                                <th className='px-6 py-4 text-left text-sm font-bold text-white'>
                                    <button
                                        onClick={() => handleSort('guard_name')}
                                        className='flex items-center gap-2 hover:text-orange-100 transition-colors cursor-pointer'
                                    >
                                        Guard
                                        <span className='ml-1'>{getSortIcon('guard_name')}</span>
                                    </button>
                                </th>
                                <th className='px-6 py-4 text-left text-sm font-bold text-white'>Permissions</th>
                                <th className='rounded-tr-2xl px-6 py-4 text-center text-sm font-bold text-white'>Aksi</th>
                            </tr>
                        </thead>

                        {/* Search Row */}
                        <thead className='bg-orange-50 dark:bg-gray-800/50'>
                            <tr>
                                <th className='px-6 py-4'></th>
                                <th className='px-6 py-4'>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className='w-full border-2 border-orange-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 bg-white dark:bg-gray-900 transition-colors'
                                            value={getSearchValue('searchName')}
                                            onChange={(e) => debouncedSearch('searchName', e.target.value, index().url)}
                                            placeholder='Cari nama role...'
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400">
                                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </th>
                                <th className='px-6 py-4'></th>
                                <th className='px-6 py-4'> {/* Tombol Reset Search */}
                                    {getSearchValue('searchName') && (
                                        <button
                                            onClick={handleResetSearch}
                                            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95"
                                            title="Reset pencarian"
                                        >
                                            <RotateCcw className='size-5' />
                                            <span className="hidden sm:inline">Reset</span>
                                        </button>
                                    )}</th>
                            </tr>
                        </thead>

                        <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                            {isSearching ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="relative">
                                                <div className="size-12 rounded-full border-4 border-orange-200 dark:border-gray-700"></div>
                                                <Loader2 className="absolute top-0 left-0 size-12 animate-spin text-orange-500 dark:text-orange-400" />
                                            </div>
                                            <span className="text-muted-foreground font-medium">Mencari data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : !roles?.data || roles.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="size-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                                <Shield className="size-8 text-orange-500 dark:text-orange-400" />
                                            </div>
                                            <p className="text-muted-foreground font-medium">Data tidak ditemukan</p>
                                            <p className="text-sm text-muted-foreground">Coba kata kunci pencarian lain</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                roles.data.map((role, index) => (
                                    <tr key={role.id} className="hover:bg-orange-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-600 dark:text-orange-400 font-bold text-sm">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                                                    <Shield className="size-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white capitalize">{role.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                                {role.guard_name}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            {role.permissions && role.permissions.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {(() => {
                                                        // Group permissions by module
                                                        const groupedPermissions: Record<string, string[]> = {};
                                                        role.permissions.forEach((permission) => {
                                                            // Extract action from permission name (e.g., "users.view" -> "view")
                                                            const parts = permission.name.split('.');
                                                            const action = parts.length > 1 ? parts[1] : permission.name;

                                                            if (!groupedPermissions[permission.module]) {
                                                                groupedPermissions[permission.module] = [];
                                                            }
                                                            groupedPermissions[permission.module].push(action);
                                                        });

                                                        return Object.entries(groupedPermissions).map(([module, actions]) => (
                                                            <span
                                                                key={module}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                                            >
                                                                <Layers className="size-3" />
                                                                <span className="capitalize">{module}</span>
                                                                <span className="text-purple-400 dark:text-purple-500">:</span>
                                                                <span className="font-normal">{actions.join(', ')}</span>
                                                            </span>
                                                        ));
                                                    })()}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    No Permissions
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    href={edit(role.id).url}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 active:scale-95"
                                                    title="Edit"
                                                >
                                                    <Pencil className="size-3.5" />
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(role.id, role.name)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                    Hapus
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
                    {roles?.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-orange-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800">
                            {/* Info Data */}
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Menampilkan <span className='font-bold text-orange-600 dark:text-orange-400'>{roles.meta.from}</span> sampai <span className='font-bold text-orange-600 dark:text-orange-400'>{roles.meta.to}</span> dari <span className='font-bold text-orange-600 dark:text-orange-400'>{roles.meta.total}</span> data
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href={buildUrl(1)}
                                    className={roles.meta.current_page === 1
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-4 py-2 text-sm font-medium'
                                        : 'inline-flex items-center gap-1 border-2 border-orange-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:hover:bg-orange-600 dark:hover:border-orange-600 transition-all duration-200'
                                    }
                                >
                                    <span>Awal</span>
                                </Link>

                                <Link
                                    href={roles.links.prev ? buildUrl(roles.meta.current_page - 1) : '#'}
                                    className={!roles.links.prev
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-3 py-2'
                                        : 'inline-flex items-center border-2 border-orange-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:hover:bg-orange-600 dark:hover:border-orange-600 transition-all duration-200'
                                    }
                                >
                                    <ArrowBigLeftIcon className="size-4" />
                                </Link>

                                {Array.from({ length: Math.min(roles.meta.last_page, 5) }, (_, i) => {
                                    let pageNum;
                                    if (roles.meta.last_page <= 5) {
                                        pageNum = i + 1;
                                    } else if (roles.meta.current_page <= 3) {
                                        pageNum = i + 1;
                                    } else if (roles.meta.current_page >= roles.meta.last_page - 2) {
                                        pageNum = roles.meta.last_page - 4 + i;
                                    } else {
                                        pageNum = roles.meta.current_page - 2 + i;
                                    }

                                    return (
                                        <Link
                                            key={pageNum}
                                            href={buildUrl(pageNum)}
                                            className={`min-w-[2.5rem] h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 ${pageNum === roles.meta.current_page
                                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30'
                                                    : 'border-2 border-orange-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700 hover:border-orange-400 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            {pageNum}
                                        </Link>
                                    );
                                })}

                                <Link
                                    href={roles.links.next ? buildUrl(roles.meta.current_page + 1) : '#'}
                                    className={!roles.links.next
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-3 py-2'
                                        : 'inline-flex items-center border-2 border-orange-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:hover:bg-orange-600 dark:hover:border-orange-600 transition-all duration-200'
                                    }
                                >
                                    <ArrowBigRight className="size-4" />
                                </Link>

                                <Link
                                    href={buildUrl(roles.meta.last_page)}
                                    className={roles.meta.current_page === roles.meta.last_page
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
