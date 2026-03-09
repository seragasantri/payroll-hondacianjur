import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import tunjanganRoutes from '@/routes/tunjangan';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Tunjangan',
        href: tunjanganRoutes.index().url
    },
    {
        title: 'Tambah Tunjangan',
        href: '#'
    }
];

interface Errors {
    jenis_tunjangan?: string[];
    perusahaan?: string[];
    karyawan?: string[];
    total?: string[];
}

export default function TunjanganCreate() {
    const { data, setData, post, processing, errors, reset } = useForm({
        jenis_tunjangan: '',
        perusahaan: '',
        karyawan: '',
        total: '0',
    });

    // Hitung total otomatis saat perusahaan atau karyawan berubah
    const updateTotal = (perusahaanValue?: string, karyawanValue?: string) => {
        const perusahaan = parseFloat(perusahaanValue ?? data.perusahaan) || 0;
        const karyawan = parseFloat(karyawanValue ?? data.karyawan) || 0;
        const total = (perusahaan + karyawan).toFixed(2);
        setData('total', total);
    };

    const handlePerusahaanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Ganti koma dengan titik untuk format desimal
        let newValue = e.target.value;
        newValue = newValue.replace(',', '.');
        setData('perusahaan', newValue);
        updateTotal(newValue, data.karyawan);
    };

    const handleKaryawanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Ganti koma dengan titik untuk format desimal
        let newValue = e.target.value;
        newValue = newValue.replace(',', '.');
        setData('karyawan', newValue);
        updateTotal(data.perusahaan, newValue);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Pastikan total dihitung sebelum submit
        updateTotal();
        post(tunjanganRoutes.store().url, {
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Tunjangan" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 sm:p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300'>
                            Tambah Tunjangan
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Form tambah data Tunjangan baru</p>
                    </div>
                    <Link
                        href={tunjanganRoutes.index().url}
                        className='inline-flex items-center gap-2 border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium px-5 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95'
                    >
                        <ArrowLeft className='size-5' />
                        <span>Kembali</span>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-blue-100 dark:shadow-none">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 px-6 py-4">
                        <h2 className="text-xl font-bold text-white">Informasi Tunjangan</h2>
                        <p className="text-blue-100 text-sm">Isi data Tunjangan dengan lengkap dan benar</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Jenis Tunjangan */}
                            <div className="space-y-2">
                                <label htmlFor="jenis_tunjangan" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Jenis Tunjangan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="jenis_tunjangan"
                                    value={data.jenis_tunjangan}
                                    onChange={(e) => setData('jenis_tunjangan', e.target.value)}
                                    className="w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 transition-colors"
                                    placeholder="Contoh: Tunjangan Kesehatan"
                                />
                                {errors.jenis_tunjangan && (
                                    <p className="text-sm text-red-500">{errors.jenis_tunjangan}</p>
                                )}
                            </div>

                            {/* Perusahaan */}
                            <div className="space-y-2">
                                <label htmlFor="perusahaan" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Perusahaan (%) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="perusahaan"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.perusahaan}
                                    onChange={handlePerusahaanChange}
                                    className="w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 transition-colors"
                                    placeholder="0.00"
                                />
                                {errors.perusahaan && (
                                    <p className="text-sm text-red-500">{errors.perusahaan}</p>
                                )}
                                <p className="text-xs text-gray-500">Persentase kontribusi dari perusahaan (0-100%)</p>
                            </div>

                            {/* Karyawan */}
                            <div className="space-y-2">
                                <label htmlFor="karyawan" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Karyawan (%) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="karyawan"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.karyawan}
                                    onChange={handleKaryawanChange}
                                    className="w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 transition-colors"
                                    placeholder="0.00"
                                />
                                {errors.karyawan && (
                                    <p className="text-sm text-red-500">{errors.karyawan}</p>
                                )}
                                <p className="text-xs text-gray-500">Persentase kontribusi dari karyawan (0-100%)</p>
                            </div>

                            {/* Total (Readonly) */}
                            <div className="space-y-2">
                                <label htmlFor="total" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Total (%) <span className="text-blue-500 text-xs">(Otomatis)</span>
                                </label>
                                <input
                                    type="text"
                                    id="total"
                                    value={`${data.total}%`}
                                    readOnly
                                    className="w-full border-2 border-blue-300 dark:border-blue-700 rounded-lg px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 font-bold cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500">Total persentase kontribusi (Perusahaan + Karyawan)</p>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <svg className="size-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm text-green-800 dark:text-green-300 font-semibold">Informasi</p>
                                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                        Total persentase akan dihitung otomatis dari penjumlahan Perusahaan + Karyawan.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
                            <Link
                                href={tunjanganRoutes.index().url}
                                className='inline-flex items-center gap-2 border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95'
                            >
                                <ArrowLeft className='size-5' />
                                <span>Batal</span>
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className='inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-500 dark:hover:from-blue-700 dark:hover:to-blue-600 text-white font-medium px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className='size-5 animate-spin' />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className='size-5' />
                                        <span>Simpan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
