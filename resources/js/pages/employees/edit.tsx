import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import employees from '@/routes/employees';
import type { BreadcrumbItem, KantorCabang, Jabatan } from '@/types';

// Fungsi helper untuk format mata uang Rupiah dengan separator ribuan
const formatRupiah = (value: string): string => {
    // Hapus semua karakter kecuali angka
    const number = value.replace(/[^0-9]/g, '');

    if (!number) return '';

    // Format dengan titik sebagai separator ribuan
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Fungsi helper untuk mendapatkan nilai numerik dari string Rupiah
const parseRupiah = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
};

interface Employee {
    id: number;
    user_id: number;
    nip: string;
    nik: string;
    jenis_kelamin?: string;
    nama: string;
    kantor_cabang_id: number;
    jabatan_id: number;
    nomor_rekening?: string;
    kjt?: string;
    status_pegawai?: string;
    kantorCabang?: { id: number; name: string };
    jabatan?: { id: number; name: string };
    tanggal_mulai_kerja: string;
    ptkp?: string;
    gaji_pokok: number;
    tunjangan_jabatan: number;
    potongan_tidak_masuk: number;
    potongan_terlambat: number;
    via_bca?: boolean;
    bpjs_ketenagakerjaan?: boolean;
    tunjangan_bpjs_kes?: boolean;
    tunjangan_jht?: boolean;
    tunjangan_jkk?: boolean;
    tunjangan_jkm?: boolean;
    tunjangan_pensiun?: boolean;
}

interface PageProps {
    employee: Employee;
    kantorCabang: KantorCabang[];
    jabatan: Jabatan[];
}

export default function EmployeeEdit({ employee, kantorCabang, jabatan }: PageProps) {
    const { data, setData, errors, put, processing } = useForm<{
        nip: string;
        nik: string;
        jenis_kelamin: string;
        nama: string;
        password: string;
        password_confirmation: string;
        kantor_cabang_id: number | '';
        jabatan_id: number | '';
        nomor_rekening: string;
        kjt: string;
        status_pegawai: string;
        tanggal_mulai_kerja: string;
        ptkp: string;
        gaji_pokok: string;
        tunjangan_jabatan: string;
        potongan_tidak_masuk: string;
        potongan_terlambat: string;
        via_bca: boolean;
        bpjs_ketenagakerjaan: boolean;
        tunjangan_bpjs_kes: boolean;
        tunjangan_jht: boolean;
        tunjangan_jkk: boolean;
        tunjangan_jkm: boolean;
        tunjangan_pensiun: boolean;
    }>({
        nip: employee.nip || '',
        nik: employee.nik || '',
        jenis_kelamin: employee.jenis_kelamin || '',
        nama: employee.nama || '',
        password: '',
        password_confirmation: '',
        kantor_cabang_id: employee.kantor_cabang_id || '',
        jabatan_id: employee.jabatan_id || '',
        nomor_rekening: employee.nomor_rekening || '',
        kjt: employee.kjt || '',
        status_pegawai: employee.status_pegawai || '',
        tanggal_mulai_kerja: employee.tanggal_mulai_kerja || '',
        ptkp: employee.ptkp || '',
        gaji_pokok: String(employee.gaji_pokok || 0),
        tunjangan_jabatan: String(employee.tunjangan_jabatan || 0),
        potongan_tidak_masuk: String(employee.potongan_tidak_masuk || 0),
        potongan_terlambat: String(employee.potongan_terlambat || 0),
        via_bca: !!employee.via_bca,
        bpjs_ketenagakerjaan: !!employee.bpjs_ketenagakerjaan,
        tunjangan_bpjs_kes: !!employee.tunjangan_bpjs_kes,
        tunjangan_jht: !!employee.tunjangan_jht,
        tunjangan_jkk: !!employee.tunjangan_jkk,
        tunjangan_jkm: !!employee.tunjangan_jkm,
        tunjangan_pensiun: !!employee.tunjangan_pensiun,
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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">
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
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm">1</span>
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
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
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
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                            placeholder="Contoh: John Doe"
                                        />
                                        {errors.nama && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.nama}</p>
                                        )}
                                    </div>
                                </div>

                                {/* NIK dan Jenis Kelamin */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* NIK */}
                                    <div>
                                        <label htmlFor="nik" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            NIK <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="nik"
                                            type="text"
                                            value={data.nik}
                                            onChange={e => setData('nik', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                            placeholder="Contoh: 1234567890123456"
                                        />
                                        {errors.nik && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.nik}</p>
                                        )}
                                    </div>

                                    {/* Jenis Kelamin */}
                                    <div>
                                        <label htmlFor="jenis_kelamin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Jenis Kelamin <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="jenis_kelamin"
                                            value={data.jenis_kelamin}
                                            onChange={e => setData('jenis_kelamin', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                        >
                                            <option value="">Pilih Jenis Kelamin</option>
                                            <option value="laki-laki">Laki-laki</option>
                                            <option value="perempuan">Perempuan</option>
                                        </select>
                                        {errors.jenis_kelamin && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.jenis_kelamin}</p>
                                        )}
                                    </div>
                                </div>

                                {/* KJT (Kartu Peserta Jamsostek) dengan Checkbox BPJS Ketenagakerjaan */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            KJT (Kartu Peserta Jamsostek)
                                        </label>
                                        <div className="flex items-center gap-2 mb-2">
                                            <input
                                                id="bpjs_ketenagakerjaan"
                                                type="checkbox"
                                                checked={data.bpjs_ketenagakerjaan}
                                                onChange={e => setData('bpjs_ketenagakerjaan', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="bpjs_ketenagakerjaan" className="text-sm text-gray-700 dark:text-gray-300">
                                                Terdaftar BPJS Ketenagakerjaan
                                            </label>
                                        </div>
                                        <input
                                            id="kjt"
                                            type="text"
                                            value={data.kjt}
                                            onChange={e => setData('kjt', e.target.value)}
                                            disabled={!data.bpjs_ketenagakerjaan}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            placeholder={data.bpjs_ketenagakerjaan ? "Contoh: 123456789012345678" : "Tidak terdaftar BPJS"}
                                        />
                                        {errors.kjt && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.kjt}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Checklist Tunjangan */}
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                        Tunjangan Perusahaan
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        Centang untuk menampilkan tunjangan di slip gaji
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="tunjangan_bpjs_kes"
                                                type="checkbox"
                                                checked={data.tunjangan_bpjs_kes}
                                                onChange={e => setData('tunjangan_bpjs_kes', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="tunjangan_bpjs_kes" className="text-sm text-gray-700 dark:text-gray-300">
                                                BPJS Kesehatan
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="tunjangan_jht"
                                                type="checkbox"
                                                checked={data.tunjangan_jht}
                                                onChange={e => setData('tunjangan_jht', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="tunjangan_jht" className="text-sm text-gray-700 dark:text-gray-300">
                                                JHT
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="tunjangan_jkk"
                                                type="checkbox"
                                                checked={data.tunjangan_jkk}
                                                onChange={e => setData('tunjangan_jkk', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="tunjangan_jkk" className="text-sm text-gray-700 dark:text-gray-300">
                                                JKK
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="tunjangan_jkm"
                                                type="checkbox"
                                                checked={data.tunjangan_jkm}
                                                onChange={e => setData('tunjangan_jkm', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="tunjangan_jkm" className="text-sm text-gray-700 dark:text-gray-300">
                                                JKM
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="tunjangan_pensiun"
                                                type="checkbox"
                                                checked={data.tunjangan_pensiun}
                                                onChange={e => setData('tunjangan_pensiun', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="tunjangan_pensiun" className="text-sm text-gray-700 dark:text-gray-300">
                                                Pensiun
                                            </label>
                                        </div>
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
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
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
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                            placeholder="Ulangi password baru"
                                        />
                                        {errors.password_confirmation && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password_confirmation}</p>
                                        )}
                                    </div>
                                </div>



                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* KantorCabang */}
                                    <div>
                                        <label htmlFor="kantor_cabang_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            KantorCabang <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="kantor_cabang_id"
                                            value={data.kantor_cabang_id}
                                            onChange={e => setData('kantor_cabang_id', e.target.value ? Number(e.target.value) : '')}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                        >
                                            <option value="">Pilih KantorCabang</option>
                                            {kantorCabang.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.kantor_cabang_id && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.kantor_cabang_id}</p>
                                        )}
                                    </div>

                                    {/* Jabatan */}
                                    <div>
                                        <label htmlFor="jabatan_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Jabatan <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="jabatan_id"
                                            value={data.jabatan_id}
                                            onChange={e => setData('jabatan_id', e.target.value ? Number(e.target.value) : '')}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                        >
                                            <option value="">Pilih Jabatan</option>
                                            {jabatan.map((j) => (
                                                <option key={j.id} value={j.id}>
                                                    {j.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.jabatan_id && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.jabatan_id}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Nomor Rekening dan Status Pegawai */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Nomor Rekening dengan Checkbox Via BCA */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Nomor Rekening
                                        </label>
                                        <div className="flex items-center gap-2 mb-2">
                                            <input
                                                id="via_bca"
                                                type="checkbox"
                                                checked={data.via_bca}
                                                onChange={e => setData('via_bca', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="via_bca" className="text-sm text-gray-700 dark:text-gray-300">
                                                Via BCA (Transfer ke Rekening)
                                            </label>
                                        </div>
                                        <input
                                            id="nomor_rekening"
                                            type="text"
                                            value={data.nomor_rekening}
                                            onChange={e => setData('nomor_rekening', e.target.value)}
                                            disabled={!data.via_bca}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            placeholder={data.via_bca ? "Contoh: 1234567890" : "Tidak ada rekening"}
                                        />
                                        {errors.nomor_rekening && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.nomor_rekening}</p>
                                        )}
                                    </div>

                                    {/* Status Pegawai */}
                                    <div>
                                        <label htmlFor="status_pegawai" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Status Pegawai
                                        </label>
                                        <select
                                            id="status_pegawai"
                                            value={data.status_pegawai}
                                            onChange={e => setData('status_pegawai', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                        >
                                            <option value="">Pilih Status</option>
                                            <option value="Pegawai Tetap">Pegawai Tetap</option>
                                            <option value="Pegawai Kontrak">Pegawai Kontrak</option>
                                        </select>
                                        {errors.status_pegawai && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.status_pegawai}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Tanggal Mulai Kerja dan PTKP */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                        />
                                        {errors.tanggal_mulai_kerja && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.tanggal_mulai_kerja}</p>
                                        )}
                                    </div>

                                    {/* PTKP */}
                                    <div>
                                        <label htmlFor="ptkp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Status PTKP <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="ptkp"
                                            value={data.ptkp}
                                            onChange={e => setData('ptkp', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                        >
                                            <option value="">Pilih PTKP</option>
                                            <option value="TK/0">TK/0 - Tidak Kawin Tanpa Tanggungan</option>
                                            <option value="TK/1">TK/1 - Tidak Kawin 1 Tanggungan</option>
                                            <option value="TK/2">TK/2 - Tidak Kawin 2 Tanggungan</option>
                                            <option value="TK/3">TK/3 - Tidak Kawin 3 Tanggungan</option>
                                            <option value="K/0">K/0 - Kawin Tanpa Tanggungan</option>
                                            <option value="K/1">K/1 - Kawin 1 Tanggungan</option>
                                            <option value="K/2">K/2 - Kawin 2 Tanggungan</option>
                                            <option value="K/3">K/3 - Kawin 3 Tanggungan</option>
                                        </select>
                                        {errors.ptkp && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.ptkp}</p>
                                        )}
                                    </div>
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
                                            value={formatRupiah(data.gaji_pokok)}
                                            onChange={e => setData('gaji_pokok', parseRupiah(e.target.value))}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
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
                                            value={formatRupiah(data.tunjangan_jabatan)}
                                            onChange={e => setData('tunjangan_jabatan', parseRupiah(e.target.value))}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
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
                                            value={formatRupiah(data.potongan_tidak_masuk)}
                                            onChange={e => setData('potongan_tidak_masuk', parseRupiah(e.target.value))}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
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
                                            value={formatRupiah(data.potongan_terlambat)}
                                            onChange={e => setData('potongan_terlambat', parseRupiah(e.target.value))}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
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
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-500 dark:hover:from-blue-700 dark:hover:to-blue-600 text-white font-medium shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
