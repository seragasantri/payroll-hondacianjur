import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowBigLeftIcon, ArrowBigRight, Pencil, PlusCircle, Trash2, Loader2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Eye, FileSpreadsheet, FileText, UserMinus } from 'lucide-react';
import Swal from 'sweetalert2';
import { useDebounceSearch } from '@/hooks/use-debounce-search';
import { useCan } from '@/hooks/useCan';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import employees, { create, destroy, edit, index } from '@/routes/employees';
import type { BreadcrumbItem, KantorCabang, Jabatan } from '@/types';
import retired from '@/routes/employees/retired';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Karyawan',
        href: employees.index().url
    }
];

interface Employee {
    id: number;
    nip: string;
    nik: string;
    jenis_kelamin?: string;
    nama: string;
    kantorCabang?: { id: number; name: string };
    jabatan?: { id: number; name: string };
    nomor_rekening?: string;
    kjt?: string;
    status_pegawai?: string;
    tanggal_mulai_kerja: string;
    ptkp?: string;
    gaji_pokok: number;
    tunjangan_jabatan: number;
    potongan_tidak_masuk: number;
    potongan_terlambat: number;
    total_gaji: number;
    total_potongan: number;
    via_bca?: boolean;
    bpjs_ketenagakerjaan?: boolean;
    tunjangan_bpjs_kes?: boolean;
    tunjangan_jht?: boolean;
    tunjangan_jkk?: boolean;
    tunjangan_jkm?: boolean;
    tunjangan_pensiun?: boolean;
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

export default function EmployeeIndex({ employees, kantorCabang, jabatan }: { employees: EmployeeList, kantorCabang: KantorCabang[], jabatan: Jabatan[] }) {
    // Get initial search values from URL
    const urlParams = new URLSearchParams(window.location.search);
    const initialSearchValues: Record<string, string> = {};
    const searchKeys = ['searchNama', 'searchNIP', 'searchStatusPegawai', 'searchJenisKelamin', 'searchKantorCabang', 'searchJabatan'];
    searchKeys.forEach(key => {
        const value = urlParams.get(key);
        if (value) {
            initialSearchValues[key] = value;
        }
    });

    const { debouncedSearch, getSearchValue, isSearching, resetSearch } = useDebounceSearch(initialSearchValues);
    const can = useCan();
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.is_super_admin ?? false;
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    // Cek apakah user punya aksi (edit atau delete)
    const hasActionAccess = isSuperAdmin || can('employees.edit') || can('employees.delete');

    // Get current sort params from URL
    const currentSortField = urlParams.get('sortField') || 'nama';
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

    const handleDelete = (employeeId: number, employeeName: string) => {
        Swal.fire({
            title: 'Resign Karyawan?',
            text: `Apakah Anda yakin ingin memensiunkan karyawan "${employeeName}"? Karyawan tidak akan dapat login kembali kecuali diaktifkan kembali.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, pensionsikan!',
            cancelButtonText: 'Batal',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return router.delete(destroy(employeeId).url, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Berhasil!',
                            text: `Karyawan "${employeeName}" berhasil diresignkan.`,
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            title: 'Gagal!',
                            text: 'Gagal memensiunkan karyawan.',
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
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300'>
                            Manajemen Karyawan
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Kelola data karyawan dengan mudah</p>
                    </div>
                    <div className="flex items-center gap-3">

                        {(isSuperAdmin || can('employees.create')) && (
                            <Link
                                href={create().url}
                                className='inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-500 dark:hover:from-blue-700 dark:hover:to-blue-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95'
                            >
                                <PlusCircle className='size-5' />
                                <span>Tambah Karyawan</span>
                            </Link>
                        )}

                        <Link
                            href={retired.index().url}
                            className='inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-500 dark:hover:from-orange-700 dark:hover:to-orange-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 dark:shadow-orange-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95'
                        >
                            <UserMinus className='size-5' />
                            <span>Karyawan Resign</span>
                        </Link>
                    </div>
                </div>

                {/* Table Card */}
                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-blue-100 dark:shadow-none">

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
                                    className="border-2 border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900"
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <span className="text-sm text-gray-600 dark:text-gray-400">data per halaman</span>
                            </div>
                        </div>

                        {/* tombol export */}
                        <div className="flex justify-center items-center gap-2 px-4">
                            <button
                                onClick={() => {
                                    const params = new URLSearchParams();
                                    const sNama = getSearchValue('searchNama');
                                    const sNIP = getSearchValue('searchNIP');
                                    const sKantor = getSearchValue('searchKantorCabang');
                                    const sJabatan = getSearchValue('searchJabatan');
                                    if (sNama) params.set('searchNama', sNama);
                                    if (sNIP) params.set('searchNIP', sNIP);
                                    if (sKantor) params.set('searchKantorCabang', sKantor);
                                    if (sJabatan) params.set('searchJabatan', sJabatan);
                                    const query = params.toString() ? `?${params.toString()}` : '';
                                    window.open(`/employees/export/pdf${query}`, '_blank');
                                }}
                                className='inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2 px-4 shadow-md shadow-red-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95'
                            >
                                <FileText className='size-4' />
                                <span>Export PDF</span>
                            </button>
                            <button
                                onClick={() => {
                                    const params = new URLSearchParams();
                                    const sNama = getSearchValue('searchNama');
                                    const sNIP = getSearchValue('searchNIP');
                                    const sKantor = getSearchValue('searchKantorCabang');
                                    const sJabatan = getSearchValue('searchJabatan');
                                    if (sNama) params.set('searchNama', sNama);
                                    if (sNIP) params.set('searchNIP', sNIP);
                                    if (sKantor) params.set('searchKantorCabang', sKantor);
                                    if (sJabatan) params.set('searchJabatan', sJabatan);
                                    const query = params.toString() ? `?${params.toString()}` : '';
                                    window.open(`/employees/export/excel${query}`, '_blank');
                                }}
                                className='inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 shadow-md shadow-green-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/30 hover:scale-105 active:scale-95'
                            >
                                <FileSpreadsheet className='size-4' />
                                <span>Export Excel</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className='w-full min-w-[600px]'>
                            <thead className='bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800'>
                                <tr>
                                    <th className='rounded-tl-2xl w-16 px-4 py-4 text-left text-sm font-bold text-white w-12'>#</th>
                                    <th className='px-4 py-4 w-55 text-left text-sm font-bold text-white'>
                                        <button
                                            onClick={() => handleSort('nama')}
                                            className='flex items-center gap-2 hover:text-blue-100 transition-colors cursor-pointer'
                                        >
                                            Nama
                                            <span className='ml-1'>{getSortIcon('nama')}</span>
                                        </button>
                                    </th>
                                    {/* <th className='px-4 py-4 w-55 text-left text-sm font-bold text-white'>
                                        <button
                                            onClick={() => handleSort('nip')}
                                            className='flex items-center gap-2 hover:text-blue-100 transition-colors cursor-pointer'
                                        >
                                            NIP
                                            <span className='ml-1'>{getSortIcon('nip')}</span>
                                        </button>
                                    </th> */}
                                    <th className='px-4 py-4 w-40 text-left text-sm font-bold text-white'>
                                        NIP
                                    </th>
                                    <th className='px-4 py-4 w-40 text-left text-sm font-bold text-white'>
                                        Status Pegawai
                                    </th>
                                    <th className='px-4 py-4 w-55 text-left text-sm font-bold text-white'>
                                        <button
                                            onClick={() => handleSort('kantorCabang')}
                                            className='flex items-center gap-2 hover:text-blue-100 transition-colors cursor-pointer'
                                        >
                                            Cabang
                                            <span className='ml-1'>{getSortIcon('kantorCabang')}</span>
                                        </button>
                                    </th>
                                    <th className='px-4 py-4 w-55 text-left text-sm font-bold text-white'>
                                        <button
                                            onClick={() => handleSort('jabatan')}
                                            className='flex items-center gap-2 hover:text-blue-100 transition-colors cursor-pointer'
                                        >
                                            Jabatan
                                            <span className='ml-1'>{getSortIcon('jabatan')}</span>
                                        </button>
                                    </th>
                                    <th className='rounded-tr-2xl px-4 py-4 text-center text-sm font-bold text-white w-28'>Aksi</th>
                                </tr>
                            </thead>

                            {/* Search Row */}
                            <thead className='bg-blue-50 dark:bg-gray-800/50'>
                                <tr>
                                    <th className='px-4 py-4'></th>
                                    <th className='px-4 py-4'>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className='w-full border-2 border-blue-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 transition-colors'
                                                value={getSearchValue('searchNama')}
                                                onChange={(e) => debouncedSearch('searchNama', e.target.value, index().url)}
                                                placeholder='Cari nama...'
                                            />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400">
                                                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </th>
                                    {/* <th className='px-4 py-4'>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className='w-full border-2 border-blue-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 transition-colors'
                                                placeholder='Cari NIP...'
                                                value={getSearchValue('searchNIP')}
                                                onChange={(e) => debouncedSearch('searchNIP', e.target.value, index().url)}
                                            />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400">
                                                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </th> */}
                                    <th className='px-4 py-4'>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className='w-full border-2 border-blue-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 transition-colors'
                                                placeholder='Cari NIP...'
                                                value={getSearchValue('searchNIP')}
                                                onChange={(e) => debouncedSearch('searchNIP', e.target.value, index().url)}
                                            />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400">
                                                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </th>
                                    <th className='px-4 py-4'>
                                        <select
                                            value={getSearchValue('searchStatusPegawai')}
                                            onChange={(e) => debouncedSearch('searchStatusPegawai', e.target.value, index().url)}
                                            className='w-full border-2 border-blue-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 transition-colors'
                                        >
                                            <option value="">Semua</option>
                                            <option value="Pegawai Tetap">Pegawai Tetap</option>
                                            <option value="Pegawai Kontrak">Pegawai Kontrak</option>
                                        </select>
                                    </th>
                                    <th className='px-4 py-4'>
                                        <select
                                            value={getSearchValue('searchKantorCabang')}
                                            onChange={(e) => debouncedSearch('searchKantorCabang', e.target.value, index().url)}
                                            className='w-full border-2 border-blue-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 transition-colors'
                                        >
                                            <option value="">Semua Cabang</option>
                                            {kantorCabang.map((d) => (
                                                <option key={d.id} value={d.name}>
                                                    {d.name}
                                                </option>
                                            ))}
                                        </select>
                                    </th>
                                    <th className='px-4 py-4'>
                                        <select
                                            value={getSearchValue('searchJabatan')}
                                            onChange={(e) => debouncedSearch('searchJabatan', e.target.value, index().url)}
                                            className='w-full border-2 border-blue-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 transition-colors'
                                        >
                                            <option value="">Semua Jabatan</option>
                                            {jabatan.map((j) => (
                                                <option key={j.id} value={j.name}>
                                                    {j.name}
                                                </option>
                                            ))}
                                        </select>
                                    </th>
                                    <th className='px-4 py-4'>
                                        {(getSearchValue('searchNama') || getSearchValue('searchNIP') || getSearchValue('searchStatusPegawai') || getSearchValue('searchJenisKelamin') || getSearchValue('searchKantorCabang') || getSearchValue('searchJabatan')) && (
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
                                        <td colSpan={6} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="relative">
                                                    <div className="size-12 rounded-full border-4 border-blue-200 dark:border-gray-700"></div>
                                                    <Loader2 className="absolute top-0 left-0 size-12 animate-spin text-blue-500 dark:text-blue-400" />
                                                </div>
                                                <span className="text-muted-foreground font-medium">Mencari data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : !employees?.data || employees.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="size-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                                    <svg className="size-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        <tr key={employee.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center size-7 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900 dark:text-white text-sm">{employee.nama}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-sm">
                                                {employee.nip || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {employee.status_pegawai === 'Pegawai Tetap' ? (
                                                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                                        Pegawai Tetap
                                                    </span>
                                                ) : employee.status_pegawai === 'Pegawai Kontrak' ? (
                                                    <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                        Pegawai  Kontrak
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                    {employee.kantorCabang?.name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                                    {employee.jabatan?.name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => setSelectedEmployee(employee)}
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-95"
                                                        title="Detail"
                                                    >
                                                        <Eye className="size-3" />
                                                    </button>
                                                    {(hasActionAccess && (isSuperAdmin || can('employees.edit'))) && (
                                                        <Link
                                                            href={edit(employee.id).url}
                                                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-amber-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 active:scale-95"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="size-3" />
                                                        </Link>
                                                    )}
                                                    {(hasActionAccess && (isSuperAdmin || can('employees.delete'))) && (
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
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {employees?.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-blue-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800">
                            {/* Info Data */}
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Menampilkan <span className='font-bold text-blue-600 dark:text-blue-400'>{employees.meta.from}</span> sampai <span className='font-bold text-blue-600 dark:text-blue-400'>{employees.meta.to}</span> dari <span className='font-bold text-blue-600 dark:text-blue-400'>{employees.meta.total}</span> data
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href={buildUrl(1)}
                                    className={employees.meta.current_page === 1
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-4 py-2 text-sm font-medium'
                                        : 'inline-flex items-center gap-1 border-2 border-blue-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-all duration-200'
                                    }
                                >
                                    <span>Awal</span>
                                </Link>

                                <Link
                                    href={employees.links.prev ? buildUrl(employees.meta.current_page - 1) : '#'}
                                    className={!employees.links.prev
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-3 py-2'
                                        : 'inline-flex items-center border-2 border-blue-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-all duration-200'
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
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                                                : 'border-2 border-blue-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-gray-600'
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
                                        : 'inline-flex items-center border-2 border-blue-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-all duration-200'
                                    }
                                >
                                    <ArrowBigRight className="size-4" />
                                </Link>

                                <Link
                                    href={buildUrl(employees.meta.last_page)}
                                    className={employees.meta.current_page === employees.meta.last_page
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-4 py-2 text-sm font-medium'
                                        : 'inline-flex items-center gap-1 border-2 border-blue-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-all duration-200'
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detail Karyawan</h2>
                            <button
                                onClick={() => setSelectedEmployee(null)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Informasi Pribadi */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Informasi Pribadi</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">NIP</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEmployee.nip}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">NIK</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEmployee.nik || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Nama</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEmployee.nama}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Jenis Kelamin</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedEmployee.jenis_kelamin === 'laki-laki' ? 'Laki-laki' : selectedEmployee.jenis_kelamin === 'perempuan' ? 'Perempuan' : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">KantorCabang</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEmployee.kantorCabang?.name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Jabatan</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEmployee.jabatan?.name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Nomor Rekening</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEmployee.nomor_rekening || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">KJT (Kartu Peserta Jamsostek)</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEmployee.kjt || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Status Pegawai</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEmployee.status_pegawai || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Mulai Kerja</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(selectedEmployee.tanggal_mulai_kerja)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Status PTKP</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEmployee.ptkp || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Informasi Gaji */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Informasi Gaji</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Gaji Pokok</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(selectedEmployee.gaji_pokok)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Tunjangan Jabatan</p>
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(selectedEmployee.tunjangan_jabatan)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Gaji</p>
                                        <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedEmployee.total_gaji)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Potongan Tidak Masuk</p>
                                        <p className="text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(selectedEmployee.potongan_tidak_masuk)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Potongan Terlambat</p>
                                        <p className="text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(selectedEmployee.potongan_terlambat)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Potongan</p>
                                        <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(selectedEmployee.total_potongan)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
