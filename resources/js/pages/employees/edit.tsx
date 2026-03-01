import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import employees from '@/routes/employees';
import type { BreadcrumbItem } from '@/types';

interface Employee {
    id: number;
    user_id: number;
    nip: string;
    nama: string;
    divisi: string;
    jabatan: string;
    tanggal_mulai_kerja: string;
    gaji_pokok: number;
    tunjangan_jabatan: number;
    potongan_tidak_masuk: number;
    potongan_terlambat: number;
}

interface PageProps {
    employee: Employee;
}

export default function EmployeeEdit({ employee }: PageProps) {
    const { data, setData, errors, put, processing } = useForm<{
        nip: string;
        nama: string;
        password: string;
        password_confirmation: string;
        divisi: string;
        jabatan: string;
        tanggal_mulai_kerja: string;
        gaji_pokok: string;
        tunjangan_jabatan: string;
        potongan_tidak_masuk: string;
        potongan_terlambat: string;
    }>({
        nip: employee.nip || '',
        nama: employee.nama || '',
        password: '',
        password_confirmation: '',
        divisi: employee.divisi || '',
        jabatan: employee.jabatan || '',
        tanggal_mulai_kerja: employee.tanggal_mulai_kerja || '',
        gaji_pokok: String(employee.gaji_pokok || 0),
        tunjangan_jabatan: String(employee.tunjangan_jabatan || 0),
        potongan_tidak_masuk: String(employee.potongan_tidak_masuk || 0),
        potongan_terlambat: String(employee.potongan_terlambat || 0),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(employees.update(employee.id).url);
    };

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
            title: 'Edit Karyawan',
            href: '#'
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Karyawan" />

            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href={employees.index().url}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="size-5" />
                        <span>Kembali</span>
                    </Link>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent dark:from-orange-400 dark:to-orange-300">
                        Edit Data Karyawan
                    </h1>
                    <p className="text-muted-foreground mt-2">Edit informasi karyawan di bawah ini</p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Section: Informasi Pribadi */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold text-sm">1</span>
                                Informasi Pribadi
                            </h2>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* NIP */}
                                    <div>
                                        <label htmlFor="nip" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            NIP <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="nip"
                                            type="text"
                                            value={data.nip}
                                            onChange={e => setData('nip', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                                            placeholder="Contoh: 12345678"
                                        />
                                        {errors.nip && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.nip}</p>
                                        )}
                                    </div>

                                    {/* Nama */}
                                    <div>
                                        <label htmlFor="nama" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Nama Lengkap <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="nama"
                                            type="text"
                                            value={data.nama}
                                            onChange={e => setData('nama', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                                            placeholder="Contoh: John Doe"
                                        />
                                        {errors.nama && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.nama}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Password (Optional for edit) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Password <span className="text-gray-400">(opsional)</span>
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                                            placeholder="Kosongkan jika tidak diubah"
                                        />
                                        {errors.password && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Konfirmasi Password <span className="text-gray-400">(opsional)</span>
                                        </label>
                                        <input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                                            placeholder="Ulangi password baru"
                                        />
                                        {errors.password_confirmation && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password_confirmation}</p>
                                        )}
                                    </div>
                                </div>



                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Divisi */}
                                    <div>
                                        <label htmlFor="divisi" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Divisi <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="divisi"
                                            type="text"
                                            value={data.divisi}
                                            onChange={e => setData('divisi', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                                            placeholder="Contoh: IT"
                                        />
                                        {errors.divisi && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.divisi}</p>
                                        )}
                                    </div>

                                    {/* Jabatan */}
                                    <div>
                                        <label htmlFor="jabatan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Jabatan <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="jabatan"
                                            type="text"
                                            value={data.jabatan}
                                            onChange={e => setData('jabatan', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                                            placeholder="Contoh: Staff"
                                        />
                                        {errors.jabatan && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.jabatan}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Tanggal Mulai Kerja */}
                                <div>
                                    <label htmlFor="tanggal_mulai_kerja" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Tanggal Mulai Kerja <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="tanggal_mulai_kerja"
                                        type="date"
                                        value={data.tanggal_mulai_kerja}
                                        onChange={e => setData('tanggal_mulai_kerja', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                                    />
                                    {errors.tanggal_mulai_kerja && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.tanggal_mulai_kerja}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section: Gaji */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-sm">2</span>
                                Informasi Gaji
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Gaji Pokok */}
                                <div>
                                    <label htmlFor="gaji_pokok" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Gaji Pokok (Rp) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                        <input
                                            id="gaji_pokok"
                                            type="text"
                                            value={data.gaji_pokok}
                                            onChange={e => setData('gaji_pokok', e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                    {errors.gaji_pokok && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.gaji_pokok}</p>
                                    )}
                                </div>

                                {/* Tunjangan Jabatan */}
                                <div>
                                    <label htmlFor="tunjangan_jabatan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Tunjangan Jabatan (Rp) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                        <input
                                            id="tunjangan_jabatan"
                                            type="text"
                                            value={data.tunjangan_jabatan}
                                            onChange={e => setData('tunjangan_jabatan', e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                    {errors.tunjangan_jabatan && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.tunjangan_jabatan}</p>
                                    )}
                                </div>

                                {/* Potongan Tidak Masuk */}
                                <div>
                                    <label htmlFor="potongan_tidak_masuk" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Potongan Tidak Masuk (Rp) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                        <input
                                            id="potongan_tidak_masuk"
                                            type="text"
                                            value={data.potongan_tidak_masuk}
                                            onChange={e => setData('potongan_tidak_masuk', e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                    {errors.potongan_tidak_masuk && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.potongan_tidak_masuk}</p>
                                    )}
                                </div>

                                {/* Potongan Terlambat */}
                                <div>
                                    <label htmlFor="potongan_terlambat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Potongan Terlambat (Rp) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                        <input
                                            id="potongan_terlambat"
                                            type="text"
                                            value={data.potongan_terlambat}
                                            onChange={e => setData('potongan_terlambat', e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                    {errors.potongan_terlambat && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.potongan_terlambat}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <svg className="size-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm text-blue-800 dark:text-blue-300">
                                    <p className="font-medium mb-1">Informasi:</p>
                                    <ul className="space-y-1 text-xs">
                                        <li>• Gaji Bersih = Gaji Pokok + Tunjangan Jabatan - Total Potongan</li>
                                        <li>• Pastikan data yang diisi sudah benar sebelum disimpan</li>
                                        <li>• NIP akan digunakan sebagai username untuk akun user</li>
                                        <li>• Password bersifat opsional (kosongkan jika tidak ingin mengubah)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                            <Link
                                href={employees.index().url}
                                className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-500 dark:hover:from-orange-700 dark:hover:to-orange-600 text-white font-medium shadow-lg shadow-orange-500/30 transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="size-5 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4 8h6m-7 4h7m-7 4v6h6m-7-4v6" />
                                        </svg>
                                        <span>Update Karyawan</span>
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
