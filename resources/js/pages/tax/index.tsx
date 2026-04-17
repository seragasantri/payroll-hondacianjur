import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Calculator, Percent, DollarSign } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Tax Settings',
        href: '/tax'
    }
];

interface TaxPtkp {
    id: number;
    ptkp_code: string;
    amount: number;
    ter_category: string;
}

interface TaxTer {
    id: number;
    category: string;
    min_gross: number;
    max_gross: number | null;
    percentage: number;
}

interface TaxPasal17 {
    id: number;
    min_pkp: number;
    max_pkp: number | null;
    percentage: number;
}

interface TaxData {
    ptkp?: TaxPtkp[];
    ter?: TaxTer[];
    Pasal17?: TaxPasal17[];
    tab: string;
}

const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

export default function TaxIndex({ ptkp, ter, Pasal17, tab }: TaxData) {
    const [activeTab, setActiveTab] = useState(tab || 'ptkp');
    const [gajiGross, setGajiGross] = useState('');
    const [ptkpCode, setPtkpCode] = useState('TK/0');
    const [calculating, setCalculating] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [terFilter, setTerFilter] = useState('all');

    // Filter TER data by category
    const filteredTer = terFilter === 'all'
        ? ter
        : ter?.filter((item) => item.category === terFilter.toUpperCase());

    const handleCalculate = async () => {
        if (!gajiGross) {
            alert('Silakan masukkan gaji gross');
            return;
        }

        setCalculating(true);
        setResult(null);

        // Get CSRF token from cookie
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1]
            ? decodeURIComponent(document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1] || '')
            : '';

        const gajiValue = parseInt(gajiGross.replace(/[^0-9]/g, '')) || 0;

        console.log('Sending request:', { gaji_gross: gajiValue, ptkp_code: ptkpCode, csrfToken: csrfToken ? 'present' : 'missing' });

        try {
            const response = await fetch('/tax/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({
                    gaji_gross: gajiValue,
                    ptkp_code: ptkpCode
                })
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
            }

            const data = await response.json();
            console.log('Tax calculation result:', data);
            setResult(data);
        } catch (error) {
            console.error('Error calculating tax:', error);
            alert('Terjadi kesalahan saat menghitung pajak: ' + error.message);
        } finally {
            setCalculating(false);
        }
    };

    const formatRupiahInput = (value: string): string => {
        const numericValue = value.replace(/[^0-9]/g, '');
        if (!numericValue) return '';
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tax Settings" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className='text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent dark:from-red-400 dark:to-red-300'>
                        Pengaturan Pajak (PPH 21)
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Pengaturan PTKP, Tarif TER, dan Tarif Pasal 17
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('ptkp')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'ptkp'
                                ? 'border-red-500 text-sky-600 dark:text-sky-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        <DollarSign className="inline-block w-4 h-4 mr-1" />
                        PTKP
                    </button>
                    <button
                        onClick={() => setActiveTab('ter')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'ter'
                                ? 'border-red-500 text-sky-600 dark:text-sky-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        <Percent className="inline-block w-4 h-4 mr-1" />
                        Tarif TER
                    </button>
                    <button
                        onClick={() => setActiveTab('pasal17')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'pasal17'
                                ? 'border-red-500 text-sky-600 dark:text-sky-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        <Percent className="inline-block w-4 h-4 mr-1" />
                        Tarif Pasal 17
                    </button>
                    <button
                        onClick={() => setActiveTab('kalkulator')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'kalkulator'
                                ? 'border-red-500 text-sky-600 dark:text-sky-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        <Calculator className="inline-block w-4 h-4 mr-1" />
                        Kalkulator
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    {activeTab === 'ptkp' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-white">Kode PTKP</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-white">Nominal</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-white">Kategori TER</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {ptkp?.map((item) => (
                                        <tr key={item.id} className="hover:bg-sky-50/50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 font-medium">{item.ptkp_code}</td>
                                            <td className="px-4 py-3 text-right">{formatRupiah(item.amount)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-xs font-semibold">
                                                    {item.ter_category}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'ter' && (
                        <div className="overflow-x-auto">
                            {/* Filter */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium">Filter Kategori:</label>
                                    <select
                                        value={terFilter}
                                        onChange={(e) => setTerFilter(e.target.value)}
                                        className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                    >
                                        <option value="all">Semua</option>
                                        <option value="a">Kategori A</option>
                                        <option value="b">Kategori B</option>
                                        <option value="c">Kategori C</option>
                                    </select>
                                </div>
                            </div>
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800">
                                    <tr>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-white">Kategori</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-white">Min Gross</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-white">Max Gross</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-white">Tarif (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {filteredTer?.map((item) => (
                                        <tr key={item.id} className="hover:bg-sky-50/50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-xs font-semibold">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">{formatRupiah(item.min_gross)}</td>
                                            <td className="px-4 py-3 text-right">{item.max_gross ? formatRupiah(item.max_gross) : '-'}</td>
                                            <td className="px-4 py-3 text-right font-medium">{item.percentage}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'pasal17' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-white">Min PKP</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-white">Max PKP</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-white">Tarif (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {Pasal17?.map((item) => (
                                        <tr key={item.id} className="hover:bg-sky-50/50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3">{formatRupiah(item.min_pkp)}</td>
                                            <td className="px-4 py-3 text-right">{item.max_pkp ? formatRupiah(item.max_pkp) : 'diatas'}</td>
                                            <td className="px-4 py-3 text-right font-bold">{item.percentage}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'kalkulator' && (
                        <div className="p-6">
                            <div className="max-w-2xl mx-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Gaji Gross Bulanan</label>
                                        <input
                                            type="text"
                                            value={gajiGross}
                                            onChange={(e) => setGajiGross(formatRupiahInput(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Status PTKP</label>
                                        <select
                                            value={ptkpCode}
                                            onChange={(e) => setPtkpCode(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                        >
                                            {ptkp?.map((p) => (
                                                <option key={p.ptkp_code} value={p.ptkp_code}>
                                                    {p.ptkp_code} - {formatRupiah(p.amount)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCalculate}
                                    disabled={calculating || !gajiGross}
                                    className="w-full px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {calculating ? 'Menghitung...' : 'Hitung PPh 21'}
                                </button>

                                {result && (
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                                            <h3 className="font-bold text-sky-700 dark:text-sky-400 mb-2">Metode TER</h3>
                                            <p className="text-sm">Tarif: {result.ter.tarif_ter}%</p>
                                            <p className="text-lg font-bold text-sky-700 dark:text-sky-400">
                                                {formatRupiah(result.ter.pph21_bulanan)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                                            <h3 className="font-bold text-sky-700 dark:text-sky-400 mb-2">Metode Pasal 17</h3>
                                            <p className="text-sm">PKP Tahunan: {formatRupiah(result.pasal17.pkp_tahunan)}</p>
                                            <p className="text-sm">Tarif: {result.pasal17.tarif_pasal17}%</p>
                                            <p className="text-lg font-bold text-sky-700 dark:text-sky-400">
                                                {formatRupiah(result.pasal17.pph21_bulanan)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
