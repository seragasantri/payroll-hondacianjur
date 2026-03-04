import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import tunjanganRoutes from '@/routes/tunjangan';
import type { BreadcrumbItem } from '@/types';

interface Tunjangan {
    id: number;
    jenis_tunjangan: string;
    perusahaan: number;
    karyawan: number;
    total: number;
    created_at: string;
    updated_at: string;
}

interface Errors {
    jenis_tunjangan?: string[];
    perusahaan?: string[];
    karyawan?: string[];
    total?: string[];
}

export default function TunjanganEdit({ tunjangan }: { tunjangan: Tunjangan }) {
    const { data, setData, put, processing, errors } = useForm({
        jenis_tunjangan: tunjangan.jenis_tunjangan || '',
        perusahaan: tunjangan.perusahaan?.toString() || '',
        karyawan: tunjangan.karyawan?.toString() || '',
        total: tunjangan.total?.toString() || '0',
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
        put(tunjanganRoutes.update(tunjangan.id).url);
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Tunjangan', href: tunjanganRoutes.index().url },
            { title: 'Edit Tunjangan', href: '#' }
        ]}>
            <Head title={`Edit Tunjangan - ${tunjangan.jenis_tunjangan}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 sm:p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent dark:from-orange-400 dark:to-orange-300'>
                            Edit Tunjangan
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Edit data Tunjangan: {tunjangan.jenis_tunjangan}</p>
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
                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-orange-100 dark:shadow-none">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800 px-6 py-4">
                        <h2 className="text-xl font-bold text-white">Informasi Tunjangan</h2>
                        <p className="text-orange-100 text-sm">Edit data Tunjangan dengan lengkap dan benar</p>
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
                                    className="w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 bg-white dark:bg-gray-900 transition-colors"
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
                                    className="w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 bg-white dark:bg-gray-900 transition-colors"
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
                                    className="w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 bg-white dark:bg-gray-900 transition-colors"
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
                        <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <svg className="size-5 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold">Perhatian</p>
                                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                        Perubahan data Tunjangan akan berdampak pada perhitungan gaji karyawan. Total persentase dihitung otomatis dari Perusahaan + Karyawan.
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
                                className='inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-500 dark:hover:from-orange-700 dark:hover:to-orange-600 text-white font-medium px-6 py-3 rounded-xl shadow-lg shadow-orange-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className='size-5 animate-spin' />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className='size-5' />
                                        <span>Simpan Perubahan</span>
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
