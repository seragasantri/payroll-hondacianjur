import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowBigLeftIcon, ArrowBigRight, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, Loader2 } from 'lucide-react';
import { FileText, FileSpreadsheet, Calculator, HeartPulse, Briefcase } from 'lucide-react';
import { useDebounceSearch } from '@/hooks/use-debounce-search';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface KantorCabang {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

interface KantorCabangList {
    data: KantorCabang[];
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

interface Props {
    cabangs: KantorCabangList;
    tahun: number;
    filters: {
        searchName: string;
        sortField: string;
        sortDirection: string;
        perPage: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Laporan',
        href: '#'
    }
];

const bulanOptions = [
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
    { value: '12', label: 'Desember' },
];

export default function LaporanIndex({ cabangs, tahun, availableMonths, filters }: Props) {
    const { props } = usePage();
    const flash = props.flash as { error?: string; success?: string } | undefined;
    const [showError, setShowError] = React.useState(false);

    React.useEffect(() => {
        if (flash?.error) {
            setShowError(true);
            const timer = setTimeout(() => setShowError(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const { debouncedSearch, getSearchValue, isSearching, resetSearch } = useDebounceSearch();

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const currentSortField = filters.sortField || 'name';
    const currentSortDirection = filters.sortDirection || 'asc';
    const currentPerPage = filters.perPage || 10;

    const laporanIndex = () => ({
        url: '/laporan',
    });

    const handlePerPageChange = (value: string) => {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('perPage', value);
        urlParams.set('page', '1');
        window.location.href = `${laporanIndex().url}?${urlParams.toString()}`;
    };

    const handleSort = (field: string) => {
        let direction = 'asc';
        if (currentSortField === field) {
            direction = currentSortDirection === 'asc' ? 'desc' : 'asc';
        }
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('sortField', field);
        urlParams.set('sortDirection', direction);
        window.location.href = `${laporanIndex().url}?${urlParams.toString()}`;
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
        const urlParams = new URLSearchParams();
        urlParams.set('page', page.toString());
        urlParams.set('tahun', tahun.toString());
        if (currentSortField) urlParams.set('sortField', currentSortField);
        if (currentSortDirection) urlParams.set('sortDirection', currentSortDirection);
        if (currentPerPage) urlParams.set('perPage', currentPerPage.toString());
        const searchName = getSearchValue('searchName');
        if (searchName) urlParams.set('searchName', searchName);
        return `?${urlParams.toString()}`;
    };

    const handleResetSearch = () => {
        resetSearch();
        window.location.href = `/laporan?tahun=${tahun}`;
    };

    const handleExport = (cabangId: number, type: string) => {
        if (type === 'bpjs-kes') {
            window.location.href = `/laporan/${cabangId}/${tahun}/export-bpjs-kes`;
        } else if (type === 'bpjs-ketenaga') {
            window.location.href = `/laporan/${cabangId}/${tahun}/export-bpjs-tk`;
        } else if (type === 'pph21-bulanan') {
            window.location.href = `/laporan/${cabangId}/${tahun}/export-pph21`;
        } else {
            console.log(`Export ${type} for cabang ${cabangId} tahun ${tahun}`);
        }
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
            <Head title="Laporan" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">

                {/* Flash Message Error */}
                {showError && flash?.error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{flash.error}</span>
                        <button
                            onClick={() => setShowError(false)}
                            className="absolute top-0 bottom-0 right-0 px-4 py-3"
                        >
                            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <title>Close</title>
                                <path d="M14.348 14.849a1.2 1.2 0 01-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 11-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 111.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 111.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 010 1.698z"/>
                            </svg>
                        </button>
                    </div>
                )}

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300'>
                            Laporan
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Export laporan payroll dan pajak per cabang</p>
                    </div>

                    {/* Filter Tahun */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="tahun" className="text-sm font-medium">
                            Tahun:
                        </label>
                        <select
                            id="tahun"
                            defaultValue={tahun}
                            onChange={(e) => {
                                const selectedTahun = e.target.value;
                                window.location.href = `/laporan?tahun=${selectedTahun}`;
                            }}
                            className="border-2 border-blue-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table Card */}
                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-blue-100 dark:shadow-none">

                    {/* Show Data Per Page */}
                    <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tampilkan:
                            </label>
                            <select
                                value={currentPerPage.toString()}
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

                    <div className="overflow-x-auto">
                        <table className='w-full min-w-[800px]'>
                            <thead className='bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800'>
                                <tr>
                                    <th className='rounded-tl-2xl px-4 py-4 text-left text-sm font-bold text-white w-12'>#</th>
                                    <th className='px-4 py-4 text-left text-sm font-bold text-white'>
                                        <button
                                            onClick={() => handleSort('name')}
                                            className='flex items-center gap-2 hover:text-blue-100 transition-colors cursor-pointer'
                                        >
                                            Nama Kantor cabang
                                            <span className='ml-1'>{getSortIcon('name')}</span>
                                        </button>
                                    </th>
                                    <th className='rounded-tr-2xl px-4 py-4 text-center text-sm font-bold text-white'>Aksi</th>
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
                                                value={getSearchValue('searchName')}
                                                onChange={(e) => debouncedSearch('searchName', e.target.value, laporanIndex().url)}
                                                placeholder='Cari Kantor cabang...'
                                            />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400">
                                                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </th>
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
                                </tr>
                            </thead>

                            <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                                {isSearching ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="relative">
                                                    <div className="size-12 rounded-full border-4 border-blue-200 dark:border-gray-700"></div>
                                                    <Loader2 className="absolute top-0 left-0 size-12 animate-spin text-blue-500 dark:text-blue-400" />
                                                </div>
                                                <span className="text-muted-foreground font-medium">Mencari data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : !cabangs?.data || cabangs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-12 text-center">
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
                                    cabangs.data.map((cabang, index) => (
                                        <tr key={cabang.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center size-7 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900 dark:text-white text-sm">{cabang.name}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap items-center justify-center gap-1">
                                                    {/* Button 1: Penggajian - Blue */}
                                                    <button
                                                        onClick={() => handleExport(cabang.id, 'penggajian')}
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-2 py-1 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                                                        title="Penggajian"
                                                    >
                                                        <Briefcase className="size-3" />
                                                        <span>Penggajian</span>
                                                    </button>

                                                    {/* Button 2: PPH21 Bulanan - Purple */}
                                                    <button
                                                        onClick={() => handleExport(cabang.id, 'pph21-bulanan')}
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 px-2 py-1 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                                                        title="PPH21 Bulanan"
                                                    >
                                                        <Calculator className="size-3" />
                                                        <span>PPH21 Bulanan</span>
                                                    </button>

                                                    {/* Button 3: PPH21 Tahunan - Indigo */}
                                                    <button
                                                        onClick={() => handleExport(cabang.id, 'pph21-tahunan')}
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 px-2 py-1 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                                                        title="PPH21 Tahunan"
                                                    >
                                                        <FileText className="size-3" />
                                                        <span>PPH21 Tahunan</span>
                                                    </button>

                                                    {/* Button 4: BPJS TK - Orange */}
                                                    <button
                                                        onClick={() => handleExport(cabang.id, 'bpjs-ketenaga')}
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-2 py-1 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                                                        title="BPJS Ketenaga kerjaan"
                                                    >
                                                        <FileSpreadsheet className="size-3" />
                                                        <span>BPJS TK</span>
                                                    </button>

                                                    {/* Button 5: BPJS Kesehatan - Green */}
                                                    <button
                                                        onClick={() => handleExport(cabang.id, 'bpjs-kes')}
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-2 py-1 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                                                        title="BPJS Kesehatan"
                                                    >
                                                        <HeartPulse className="size-3" />
                                                        <span>BPJS Kes</span>
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
                    {cabangs?.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-blue-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800">
                            {/* Info Data */}
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Menampilkan <span className='font-bold text-blue-600 dark:text-blue-400'>{cabangs.meta.from}</span> sampai <span className='font-bold text-blue-600 dark:text-blue-400'>{cabangs.meta.to}</span> dari <span className='font-bold text-blue-600 dark:text-blue-400'>{cabangs.meta.total}</span> data
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href={buildUrl(1)}
                                    className={cabangs.meta.current_page === 1
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-4 py-2 text-sm font-medium'
                                        : 'inline-flex items-center gap-1 border-2 border-blue-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-all duration-200'
                                    }
                                >
                                    <span>Awal</span>
                                </Link>

                                <Link
                                    href={cabangs.links.prev ? buildUrl(cabangs.meta.current_page - 1) : '#'}
                                    className={!cabangs.links.prev
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-3 py-2'
                                        : 'inline-flex items-center border-2 border-blue-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-all duration-200'
                                    }
                                >
                                    <ArrowBigLeftIcon className="size-4" />
                                </Link>

                                {Array.from({ length: Math.min(cabangs.meta.last_page, 5) }, (_, i) => {
                                    let pageNum;
                                    if (cabangs.meta.last_page <= 5) {
                                        pageNum = i + 1;
                                    } else if (cabangs.meta.current_page <= 3) {
                                        pageNum = i + 1;
                                    } else if (cabangs.meta.current_page >= cabangs.meta.last_page - 2) {
                                        pageNum = cabangs.meta.last_page - 4 + i;
                                    } else {
                                        pageNum = cabangs.meta.current_page - 2 + i;
                                    }

                                    return (
                                        <Link
                                            key={pageNum}
                                            href={buildUrl(pageNum)}
                                            className={`min-w-[2.5rem] h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 ${pageNum === cabangs.meta.current_page
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                                                : 'border-2 border-blue-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            {pageNum}
                                        </Link>
                                    );
                                })}

                                <Link
                                    href={cabangs.links.next ? buildUrl(cabangs.meta.current_page + 1) : '#'}
                                    className={!cabangs.links.next
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-xl px-3 py-2'
                                        : 'inline-flex items-center border-2 border-blue-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-all duration-200'
                                    }
                                >
                                    <ArrowBigRight className="size-4" />
                                </Link>

                                <Link
                                    href={buildUrl(cabangs.meta.last_page)}
                                    className={cabangs.meta.current_page === cabangs.meta.last_page
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
        </AppLayout>
    );
}
