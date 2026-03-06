import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface TunjanganItem {
    id: number;
    jenis: string;
    perusahaan: number;
    karyawan: number;
}

interface EmployeePayroll {
    id: number;
    nip: string;
    nama: string;
    divisi: string;
    jabatan: string;
    gaji_pokok: number;
    tunjangan_jabatan: number;
    potongan_tidak_masuk: number;
    potongan_terlambat: number;
    tunjangan: TunjanganItem[];
    payroll: {
        id: number;
        hari_kerja: number;
        hari_masuk: number;
        jam_terlambat: number;
        tunjangan_lain: number;
        insentif: number;
        potongan_tidak_masuk: number;
        potongan_terlambat: number;
        potongan_lain: number;
        total_gaji: number;
        total_potongan: number;
        gaji_bersih: number;
        status: string;
    } | null;
}

interface TunjanganList {
    id: number;
    jenis_tunjangan: string;
    karyawan: number;
    total: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Payroll', href: '/payroll' },
    { title: 'Buat Payroll', href: '#' }
];

const formatRupiahInput = (value: string): string => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseRupiah = (value: string): number => {
    return parseInt(value.replace(/[^0-9]/g, '')) || 0;
};

export default function PayrollCreate({
    bulan,
    employees,
    tunjanganList
}: {
    bulan: string,
    employees: EmployeePayroll[],
    tunjanganList: TunjanganList[]
}) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.is_super_admin ?? false;
    const [saving, setSaving] = useState(false);

    const formatBulan = (bulan: string) => {
        const [year, month] = bulan.split('-');
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const [formData, setFormData] = useState<Record<number, {
        hari_kerja: number;
        hari_tidak_masuk: number;
        jam_terlambat: number;
        insentif: string;
        tunjangan: Record<number, { perusahaan: number; karyawan: number }>;
        potongan_lain: string;
        status: string;
    }>>(() => {
        const initial: Record<number, any> = {};
        employees.forEach(emp => {
            const tunjanganObj: Record<number, { perusahaan: number; karyawan: number }> = {};
            emp.tunjangan?.forEach((t: TunjanganItem) => {
                tunjanganObj[t.id] = {
                    perusahaan: t.perusahaan,
                    karyawan: t.karyawan
                };
            });

            const existingHariMasuk = emp.payroll?.hari_masuk ?? 22;
            const existingHariKerja = emp.payroll?.hari_kerja ?? 22;
            const hariTidakMasuk = Math.max(0, existingHariKerja - existingHariMasuk);

            const existingInsentif = emp.payroll?.insentif ?? 0;
            const formattedInsentif = existingInsentif ? formatRupiahInput(String(existingInsentif)) : '';

            const existingPotonganLain = emp.payroll?.potongan_lain ?? 0;
            const formattedPotonganLain = existingPotonganLain ? formatRupiahInput(String(existingPotonganLain)) : '';

            initial[emp.id] = {
                hari_kerja: existingHariKerja,
                hari_tidak_masuk: hariTidakMasuk,
                jam_terlambat: emp.payroll?.jam_terlambat ?? 0,
                insentif: formattedInsentif,
                tunjangan: tunjanganObj,
                potongan_lain: formattedPotonganLain,
                status: emp.payroll?.status ?? 'draft',
            };
        });
        return initial;
    });

    // Calculate functions
    const getPotonganTidakMasuk = (empId: number) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return 0;
        const hariTidakMasuk = formData[empId]?.hari_tidak_masuk || 0;
        if (hariTidakMasuk <= 0) return 0;
        return hariTidakMasuk * (Number(emp.potongan_tidak_masuk) || 0);
    };

    const getPotonganTerlambat = (empId: number) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return 0;
        const jamTerlambat = formData[empId]?.jam_terlambat || 0;
        if (jamTerlambat <= 0) return 0;
        return jamTerlambat * (Number(emp.potongan_terlambat) || 0);
    };

    const getTotalTunjangan = (empId: number) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return 0;
        let total = Number(emp.tunjangan_jabatan) || 0;

        // Add insentif
        total += parseRupiah(String(formData[empId]?.insentif || 0));

        // Add tunjangan perusahaan
        const tunjangan = formData[empId]?.tunjangan;
        if (tunjangan) {
            Object.values(tunjangan).forEach((t: { perusahaan: number; karyawan: number }) => {
                total += Number(t.perusahaan) || 0;
            });
        }

        return total;
    };

    const getTotalPotongan = (empId: number) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return 0;

        let totalPotonganKaryawan = 0;
        const tunjangan = formData[empId]?.tunjangan;
        if (tunjangan) {
            Object.values(tunjangan).forEach((t: { perusahaan: number; karyawan: number }) => {
                totalPotonganKaryawan += Number(t.karyawan) || 0;
            });
        }

        return getPotonganTidakMasuk(empId) +
            getPotonganTerlambat(empId) +
            parseRupiah(String(formData[empId]?.potongan_lain || 0)) +
            totalPotonganKaryawan;
    };

    const getGajiBersih = (empId: number) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return 0;
        return (Number(emp.gaji_pokok) || 0) + getTotalTunjangan(empId) - getTotalPotongan(empId);
    };

    const handleSubmit = (publish: boolean = false) => {
        setSaving(true);

        const payrollData: Record<number, any> = {};

        employees.forEach(emp => {
            const data = formData[emp.id];

            const tunjanganArray = Object.entries(data?.tunjangan || {}).map(([id, vals]) => ({
                id: parseInt(id),
                perusahaan: parseRupiah(String(vals.perusahaan)),
                karyawan: parseRupiah(String(vals.karyawan))
            }));

            const hariKerja = data?.hari_kerja || 22;
            const hariTidakMasuk = data?.hari_tidak_masuk || 0;
            const hariMasuk = Math.max(0, hariKerja - hariTidakMasuk);

            payrollData[emp.id] = {
                hari_kerja: hariKerja,
                hari_masuk: hariMasuk,
                jam_terlambat: data?.jam_terlambat || 0,
                insentif: parseRupiah(String(data?.insentif || 0)),
                tunjangan: tunjanganArray,
                potongan_lain: parseRupiah(String(data?.potongan_lain || 0)),
                status: publish ? 'published' : (data?.status || 'draft'),
            };
        });

        router.put(`/payroll/${bulan}`, {
            payroll: payrollData,
            publish: publish
        }, {
            onFinish: () => setSaving(false),
        });
    };

    const totalGajiPokok = employees.reduce((sum, e) => sum + (Number(e.gaji_pokok) || 0), 0);
    const totalInsentif = employees.reduce((sum, e) => sum + parseRupiah(String(formData[e.id]?.insentif || 0)), 0);
    const totalTunjangan = employees.reduce((sum, e) => sum + getTotalTunjangan(e.id), 0);
    const totalPotongan = employees.reduce((sum, e) => sum + getTotalPotongan(e.id), 0);
    const totalGajiBersih = employees.reduce((sum, e) => sum + getGajiBersih(e.id), 0);

    const tunjanganCols = tunjanganList || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll ${formatBulan(bulan)}`} />

            <div className="p-6">
                <div className="mb-6">
                    <Link
                        href="/payroll"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="size-5" />
                        <span>Kembali</span>
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent dark:from-orange-400 dark:to-orange-300">
                                Payroll {formatBulan(bulan)}
                            </h1>
                            <p className="text-muted-foreground mt-2">Isi data payroll untuk {employees.length} karyawan</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-lg shadow-orange-500/30 transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                                <span>Simpan Draft</span>
                            </button>
                            <button
                                onClick={() => handleSubmit(true)}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium shadow-lg shadow-green-500/30 transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                                <span>Simpan & Publish</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
                    <div className="overflow-x-auto">
                        <table className='w-full'>
                            <thead className='bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800'>
                                <tr>
                                    <th className='px-2 py-3 text-center text-xs font-bold text-white w-10' rowSpan={2}>#</th>
                                    <th className='px-3 py-3 text-left text-xs font-bold text-white min-w-[180px]' rowSpan={2}>Nama</th>
                                    <th className='px-3 py-3 text-right text-xs font-bold text-white' rowSpan={2}>Gaji Pokok</th>
                                    <th className='px-3 py-3 text-right text-xs font-bold text-white' rowSpan={2}>Tunjangan</th>
                                    <th className='px-3 py-3 text-right text-xs font-bold text-white' rowSpan={2}>Insentif</th>
                                    <th className='px-3 py-3 text-center text-xs font-bold text-white' colSpan={tunjanganCols.length}>TUNJANGAN</th>
                                    <th className='px-3 py-3 text-right text-xs font-bold text-white' rowSpan={2}>Mangkir</th>
                                    <th className='px-3 py-3 text-right text-xs font-bold text-white' rowSpan={2}>Terlambat</th>
                                    <th className='px-3 py-3 text-right text-xs font-bold text-white' rowSpan={2}>Kasbon</th>
                                    <th className='px-3 py-3 text-center text-xs font-bold text-white' colSpan={tunjanganCols.length}>POTONGAN</th>
                                    <th className='px-3 py-3 text-right text-xs font-bold text-white' rowSpan={2}>Total</th>
                                </tr>
                                <tr>
                                    {tunjanganCols.map((t: TunjanganList) => (
                                        <th key={t.id} className='px-2 py-2 text-right text-xs font-bold text-white bg-orange-400 dark:bg-orange-600 min-w-[80px]'>
                                            {t.jenis_tunjangan}
                                        </th>
                                    ))}
                                    {tunjanganCols.map((t: TunjanganList) => (
                                        <th key={t.id} className='px-2 py-2 text-right text-xs font-bold text-white bg-red-400 dark:bg-red-600 min-w-[80px]'>
                                            {t.jenis_tunjangan}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                                {employees.map((employee, index) => {
                                    const empGajiBersih = getGajiBersih(employee.id);

                                    return (
                                        <tr key={employee.id} className="hover:bg-orange-50/50 dark:hover:bg-gray-800/50">
                                            <td className="px-2 py-3 text-center">
                                                <span className="inline-flex items-center justify-center size-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold text-xs">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{employee.nama}</div>
                                                    <div className="text-xs text-gray-500">{employee.nip} | {employee.jabatan}</div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm font-medium">
                                                {formatCurrency(Number(employee.gaji_pokok) || 0)}
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm font-medium text-green-600">
                                                {formatCurrency(Number(employee.tunjangan_jabatan) || 0)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <input
                                                    type="text"
                                                    value={formData[employee.id]?.insentif ?? ''}
                                                    onChange={(e) => {
                                                        const formatted = formatRupiahInput(e.target.value);
                                                        setFormData({
                                                            ...formData,
                                                            [employee.id]: {
                                                                ...formData[employee.id],
                                                                insentif: formatted
                                                            }
                                                        });
                                                    }}
                                                    className="w-28 px-2 py-1 text-right text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500"
                                                    placeholder="0"
                                                />
                                            </td>
                                            {tunjanganCols.map((t: TunjanganList) => (
                                                <td key={t.id} className="px-2 py-3 text-right text-sm font-medium text-green-600">
                                                    {formatCurrency(formData[employee.id]?.tunjangan?.[t.id]?.perusahaan || 0)}
                                                </td>
                                            ))}
                                            <td className="px-3 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData[employee.id]?.hari_tidak_masuk ?? 0}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        [employee.id]: {
                                                            ...formData[employee.id],
                                                            hari_tidak_masuk: parseInt(e.target.value) || 0
                                                        }
                                                    })}
                                                    className="w-14 px-2 py-1 text-center text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500"
                                                />
                                                <div className="text-xs text-red-500">
                                                    {formatCurrency(getPotonganTidakMasuk(employee.id))}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData[employee.id]?.jam_terlambat ?? 0}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        [employee.id]: {
                                                            ...formData[employee.id],
                                                            jam_terlambat: parseInt(e.target.value) || 0
                                                        }
                                                    })}
                                                    className="w-14 px-2 py-1 text-center text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500"
                                                />
                                                <div className="text-xs text-red-500">
                                                    {formatCurrency(getPotonganTerlambat(employee.id))}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <input
                                                    type="text"
                                                    value={formData[employee.id]?.potongan_lain ?? ''}
                                                    onChange={(e) => {
                                                        const formatted = formatRupiahInput(e.target.value);
                                                        setFormData({
                                                            ...formData,
                                                            [employee.id]: {
                                                                ...formData[employee.id],
                                                                potongan_lain: formatted
                                                            }
                                                        });
                                                    }}
                                                    className="w-28 px-2 py-1 text-right text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500"
                                                    placeholder="0"
                                                />
                                            </td>
                                            {tunjanganCols.map((t: TunjanganList) => (
                                                <td key={t.id} className="px-2 py-3 text-right text-sm font-medium text-red-600">
                                                    {formatCurrency(formData[employee.id]?.tunjangan?.[t.id]?.karyawan || 0)}
                                                </td>
                                            ))}
                                            <td className="px-3 py-3 text-right text-sm font-bold text-blue-600">
                                                {formatCurrency(empGajiBersih)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className='bg-gray-100 dark:bg-gray-800'>
                                <tr>
                                    <td colSpan={2} className="px-3 py-4 text-right font-bold text-gray-900 dark:text-white">
                                        TOTAL
                                    </td>
                                    <td className="px-3 py-4 text-right font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(totalGajiPokok)}
                                    </td>
                                    <td className="px-3 py-4 text-right font-bold text-green-600">
                                        {formatCurrency(employees.reduce((sum, e) => sum + (Number(e.tunjangan_jabatan) || 0), 0))}
                                    </td>
                                    <td className="px-3 py-4 text-right font-bold text-green-600">
                                        {formatCurrency(totalInsentif)}
                                    </td>
                                    {tunjanganCols.map((t: TunjanganList) => {
                                        const colTotal = employees.reduce((sum, e) => {
                                            return sum + (Number(formData[e.id]?.tunjangan?.[t.id]?.perusahaan) || 0);
                                        }, 0);
                                        return (
                                            <td key={t.id} className="px-2 py-4 text-right font-bold text-green-600 text-sm">
                                                {formatCurrency(colTotal)}
                                            </td>
                                        );
                                    })}
                                    <td className="px-3 py-4"></td>
                                    <td className="px-3 py-4"></td>
                                    <td className="px-3 py-4"></td>
                                    {tunjanganCols.map((t: TunjanganList) => {
                                        const colTotal = employees.reduce((sum, e) => {
                                            return sum + (Number(formData[e.id]?.tunjangan?.[t.id]?.karyawan) || 0);
                                        }, 0);
                                        return (
                                            <td key={t.id} className="px-2 py-4 text-right font-bold text-red-600 text-sm">
                                                {formatCurrency(colTotal)}
                                            </td>
                                        );
                                    })}
                                    <td className="px-3 py-4 text-right font-bold text-blue-600">
                                        {formatCurrency(totalGajiBersih)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
