import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { log } from 'console';

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
    kantorCabang: string;
    jabatan: string;
    ptkp: string;
    gaji_pokok: number;
    tunjangan_jabatan: number;
    potongan_tidak_masuk: number;
    potongan_terlambat: number;
    bpjs_ketenagakerjaan?: boolean;
    tunjangan_bpjs_kes?: boolean;
    tunjangan_jht?: boolean;
    tunjangan_jkk?: boolean;
    tunjangan_jkm?: boolean;
    tunjangan_pensiun?: boolean;
    tunjangan: TunjanganItem[];
    payroll: {
        id: number;
        hari_kerja: number;
        hari_masuk: number;
        jam_terlambat: number;
        insentif: number;
        uang_hadir: number;
        lembur: number;
        reward: number;
        lain_lain: number;
        kasbon: number;
        potongan_tidak_masuk: number;
        potongan_terlambat: number;
        potongan_lain: number;
        total_gaji: number;
        total_potongan: number;
        gaji_bersih: number;
        status: string;
        gaji_pokok?: number;
        tunjangan_jabatan?: number;
        pph21_amount?: number;
        tax_method?: string;
        tax_rate_applied?: number;
    } | null;
}

interface TunjanganList {
    id: number;
    jenis_tunjangan: string;
    karyawan: number;
    total: number;
    perusahaan: number;
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
    status,
    payrollId,
    employees,
    tunjanganList
}: {
    bulan: string,
    status: string,
    payrollId?: number,
    employees: EmployeePayroll[],
    tunjanganList: TunjanganList[]
}) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.is_super_admin ?? false;
    const [saving, setSaving] = useState(false);
    const [sortField, setSortField] = useState<'nama' | 'nip' | 'kantorCabang' | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Filter states
    const [filterNip, setFilterNip] = useState('');
    const [filterCabang, setFilterCabang] = useState('');

    // Sort handler
    const handleSort = (field: 'nama' | 'nip' | 'kantorCabang') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Sort and filter employees
    const filteredEmployees = employees.filter(emp => {
        const matchNip = filterNip === '' || emp.nip.toLowerCase().includes(filterNip.toLowerCase());
        const matchCabang = filterCabang === '' || emp.kantorCabang === filterCabang;
        return matchNip && matchCabang;
    });

    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
        if (!sortField) return 0;
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        const comparison = aVal.toString().localeCompare(bVal.toString());
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Helper function to check if tunjangan is enabled for an employee
    // Check if the tunjangan ID exists in emp.tunjangan array
    const isTunjanganEnabled = (emp: EmployeePayroll, tunjanganId: number): boolean => {
        if (!Array.isArray(emp.tunjangan)) return false;
        return emp.tunjangan.some(t => Number(t.id) === tunjanganId);
    };

    const formatBulan = (bulan: string) => {
        // Handle THR case (e.g., "THR 2026")
        if (bulan.startsWith('THR')) {
            return bulan;
        }
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

    // PTKP data
    const ptkpData: Record<string, { amount: number; category: string }> = {
        'TK/0': { amount: 54000000, category: 'A' },
        'TK/1': { amount: 58500000, category: 'A' },
        'K/0': { amount: 58500000, category: 'A' },
        'TK/2': { amount: 63000000, category: 'B' },
        'TK/3': { amount: 67500000, category: 'B' },
        'K/1': { amount: 63000000, category: 'B' },
        'K/2': { amount: 67500000, category: 'B' },
        'K/3': { amount: 72000000, category: 'C' },
    };

    // TER rates (simplified - main brackets only)
    const terRates: Record<string, { min: number; max: number | null; percentage: number }[]> = {
        'A': [
            { min: 0, max: 5400000, percentage: 0 },
            { min: 5400001, max: 5650000, percentage: 0.25 },
            { min: 5650001, max: 5950000, percentage: 0.5 },
            { min: 5950001, max: 6300000, percentage: 0.75 },
            { min: 6300001, max: 6750000, percentage: 1.0 },
            { min: 6750001, max: 7500000, percentage: 1.25 },
            { min: 7500001, max: 8550000, percentage: 1.5 },
            { min: 8550001, max: 9650000, percentage: 1.75 },
            { min: 9650001, max: 10050000, percentage: 2.0 },
            { min: 10050001, max: 10350000, percentage: 2.25 },
            { min: 10350001, max: 10700000, percentage: 2.5 },
            { min: 10700001, max: 11050000, percentage: 3.0 },
            { min: 11050001, max: 11600000, percentage: 3.5 },
            { min: 11600001, max: 12500000, percentage: 4.0 },
            { min: 12500001, max: 13750000, percentage: 5.0 },
            { min: 13750001, max: 15100000, percentage: 6.0 },
            { min: 15100001, max: 16950000, percentage: 7.0 },
            { min: 16950001, max: 19750000, percentage: 8.0 },
            { min: 19750001, max: 24150000, percentage: 9.0 },
            { min: 24150001, max: 26450000, percentage: 10.0 },
            { min: 26450001, max: 28000000, percentage: 11.0 },
            { min: 28000001, max: 30050000, percentage: 12.0 },
            { min: 30050001, max: 32400000, percentage: 13.0 },
            { min: 32400001, max: 35000000, percentage: 14.0 },
            { min: 35000001, max: 40000000, percentage: 15.0 },
            { min: 40000001, max: 50000000, percentage: 16.0 },
            { min: 50000001, max: 60000000, percentage: 17.0 },
            { min: 60000001, max: 75000000, percentage: 18.0 },
            { min: 75000001, max: 100000000, percentage: 19.0 },
            { min: 100000001, max: 200000000, percentage: 20.0 },
            { min: 200000001, max: null, percentage: 21.0 },
        ],
        'B': [
            { min: 0, max: 6200000, percentage: 0 },
            { min: 6200001, max: 6500000, percentage: 0.25 },
            { min: 6500001, max: 6850000, percentage: 0.5 },
            { min: 6850001, max: 7300000, percentage: 0.75 },
            { min: 7300001, max: 9200000, percentage: 1.0 },
            { min: 9200001, max: 10750000, percentage: 1.5 },
            { min: 10750001, max: 11250000, percentage: 2.0 },
            { min: 11250001, max: 11600000, percentage: 2.5 },
            { min: 11600001, max: 12600000, percentage: 3.0 },
            { min: 12600001, max: 13600000, percentage: 4.0 },
            { min: 13600001, max: 14950000, percentage: 5.0 },
            { min: 14950001, max: 16400000, percentage: 6.0 },
            { min: 16400001, max: 18450000, percentage: 7.0 },
            { min: 18450001, max: 21850000, percentage: 8.0 },
            { min: 21850001, max: 26000000, percentage: 9.0 },
            { min: 26000001, max: 27700000, percentage: 10.0 },
            { min: 27700001, max: 29350000, percentage: 11.0 },
            { min: 29350001, max: 31450000, percentage: 12.0 },
            { min: 31450001, max: 35000000, percentage: 13.0 },
            { min: 35000001, max: 40000000, percentage: 14.0 },
            { min: 40000001, max: 50000000, percentage: 15.0 },
            { min: 50000001, max: 60000000, percentage: 16.0 },
            { min: 60000001, max: 75000000, percentage: 17.0 },
            { min: 75000001, max: 100000000, percentage: 18.0 },
            { min: 100000001, max: 200000000, percentage: 19.0 },
            { min: 200000001, max: null, percentage: 20.0 },
        ],
        'C': [
            { min: 0, max: 6600000, percentage: 0 },
            { min: 6600001, max: 6950000, percentage: 0.25 },
            { min: 6950001, max: 7350000, percentage: 0.5 },
            { min: 7350001, max: 7800000, percentage: 0.75 },
            { min: 7800001, max: 8850000, percentage: 1.0 },
            { min: 8850001, max: 9800000, percentage: 1.25 },
            { min: 9800001, max: 10950000, percentage: 1.5 },
            { min: 10950001, max: 11200000, percentage: 1.75 },
            { min: 11200001, max: 12050000, percentage: 2.0 },
            { min: 12050001, max: 12950000, percentage: 3.0 },
            { min: 12950001, max: 14150000, percentage: 4.0 },
            { min: 14150001, max: 15550000, percentage: 5.0 },
            { min: 15550001, max: 17050000, percentage: 6.0 },
            { min: 17050001, max: 19500000, percentage: 7.0 },
            { min: 19500001, max: 22700000, percentage: 8.0 },
            { min: 22700001, max: 26600000, percentage: 9.0 },
            { min: 26600001, max: 28100000, percentage: 10.0 },
            { min: 28100001, max: 30100000, percentage: 11.0 },
            { min: 30100001, max: 32600000, percentage: 12.0 },
            { min: 32600001, max: 35000000, percentage: 13.0 },
            { min: 35000001, max: 40000000, percentage: 14.0 },
            { min: 40000001, max: 50000000, percentage: 15.0 },
            { min: 50000001, max: 60000000, percentage: 16.0 },
            { min: 60000001, max: 75000000, percentage: 17.0 },
            { min: 75000001, max: 100000000, percentage: 18.0 },
            { min: 100000001, max: 200000000, percentage: 19.0 },
            { min: 200000001, max: null, percentage: 20.0 },
        ],
    };

    // Calculate tax using TER method
    const calculateTax = (grossSalary: number, ptkpCode: string): { tax: number; rate: number } => {
        const ptkp = ptkpData[ptkpCode] || ptkpData['TK/0'];
        const category = ptkp.category;
        const rates = terRates[category] || terRates['A'];

        // Find applicable TER rate - salary must be >= min
        let taxRate = 0;
        for (const rate of rates) {
            if (grossSalary >= rate.min) {
                // Check if within this bracket's max, or if this is the last bracket (max is high enough)
                if (rate.max === null || grossSalary <= rate.max) {
                    taxRate = rate.percentage;
                    break;
                }
            }
        }

        const tax = Math.round(grossSalary * taxRate / 100);
        return { tax, rate: taxRate };
    };

    // Calculate gross salary for tax (exclude JHT id=8 & Pensiun id=5, subtract potongan terlambat)
    const getGrossSalary = (empId: number) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return 0;

        const gajiPokok = parseRupiah(String(formData[empId]?.gaji_pokok || 0));
        const tunjanganJabatan = parseRupiah(String(formData[empId]?.tunjangan_jabatan || 0));
        const insentif = parseRupiah(String(formData[empId]?.insentif || 0));
        const uangHadir = parseRupiah(String(formData[empId]?.uang_hadir || 0));
        const lembur = parseRupiah(String(formData[empId]?.lembur || 0));
        const reward = parseRupiah(String(formData[empId]?.reward || 0));
        const lainLain = parseRupiah(String(formData[empId]?.lain_lain || 0));

        // Add tunjangan perusahaan (exclude JHT id=8 & Pensiun id=5 from tax)
        let tunjanganPerusahaanPajak = 0;
        const tunjangan = formData[empId]?.tunjangan;
        if (tunjangan) {
            Object.entries(tunjangan).forEach(([id, t]: [string, { perusahaan: number; karyawan: number }]) => {
                // Exclude JHT (id = 8) and Pensiun (id = 5) from tax calculation
                if (id !== '2' && id !== '5') {
                    tunjanganPerusahaanPajak += Number(t.perusahaan) || 0;
                }
            });
        }

        // Subtract potongan tidak masuk and terlambat for tax
        const potonganTerlambat = getPotonganTerlambat(empId);
        const potonganTidakMasuk = getPotonganTidakMasuk(empId);
        const totalPotonganAbsen = potonganTerlambat + potonganTidakMasuk;

        // TJ Perusahaan minus absen (tidak masuk + terlambat)
        const tjPerusahaanMinAbsen = Math.max(0, tunjanganPerusahaanPajak - totalPotonganAbsen);

        return gajiPokok + tunjanganJabatan + insentif + uangHadir + lembur + reward + lainLain + tjPerusahaanMinAbsen;
    };

    // Get calculated tax for employee
    const getCalculatedTax = (empId: number) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return 0;

        const grossSalary = getGrossSalary(empId);
        const result = calculateTax(grossSalary, emp.ptkp);
        return result.tax;
    };

    const [formData, setFormData] = useState<Record<number, {
        hari_kerja: number;
        hari_tidak_masuk: number;
        jam_terlambat: number;
        insentif: string;
        uang_hadir: string;
        lembur: string;
        reward: string;
        lain_lain: string;
        kasbon: string;
        tunjangan: Record<string, { perusahaan: number; karyawan: number }>;
        potongan_lain: string;
        status: string;
        gaji_pokok: string;
        tunjangan_jabatan: string;
    }>>(() => {
        const initial: Record<number, any> = {};
        employees.forEach(emp => {
            const tunjanganObj: Record<string, { perusahaan: number; karyawan: number }> = {};
            // Get gaji_pokok from payroll or employee default
            const gajiPokok = emp.payroll?.gaji_pokok || emp.gaji_pokok || 0;
            // Use tunjanganList to get the percentages
            const tunjanganListMap: Record<number, { perusahaan: number; karyawan: number }> = {};
            tunjanganList?.forEach((t: TunjanganList) => {
                tunjanganListMap[t.id] = {
                    perusahaan: Number(t.perusahaan) || 0,
                    karyawan: Number(t.karyawan) || 0
                };
            });
            if (Array.isArray(emp.tunjangan)) {
                emp.tunjangan.forEach((t: TunjanganItem) => {
                    // Ensure id is converted to string for consistent key access
                    const key = String(Number(t.id));
                    // Get percentages from tunjanganList (not from stored tunjangan values)
                    const pct = tunjanganListMap[t.id] || { perusahaan: 0, karyawan: 0 };
                    const perusahaanVal = Math.round(gajiPokok * pct.perusahaan / 100);
                    const karyawanVal = Math.round(gajiPokok * pct.karyawan / 100);
                    tunjanganObj[key] = {
                        perusahaan: perusahaanVal,
                        karyawan: karyawanVal
                    };
                });
            }

            const existingHariMasuk = emp.payroll?.hari_masuk ?? 22;
            const existingHariKerja = emp.payroll?.hari_kerja ?? 22;
            const hariTidakMasuk = Math.max(0, existingHariKerja - existingHariMasuk);

            const existingInsentif = emp.payroll?.insentif ?? 0;
            const formattedInsentif = existingInsentif ? formatRupiahInput(String(existingInsentif)) : '';

            const existingUangHadir = emp.payroll?.uang_hadir ?? 0;
            const formattedUangHadir = existingUangHadir ? formatRupiahInput(String(existingUangHadir)) : '';

            const existingLembur = emp.payroll?.lembur ?? 0;
            const formattedLembur = existingLembur ? formatRupiahInput(String(existingLembur)) : '';

            const existingReward = emp.payroll?.reward ?? 0;
            const formattedReward = existingReward ? formatRupiahInput(String(existingReward)) : '';

            const existingLainLain = emp.payroll?.lain_lain ?? 0;
            const formattedLainLain = existingLainLain ? formatRupiahInput(String(existingLainLain)) : '';

            const existingPotonganLain = emp.payroll?.potongan_lain ?? 0;
            const formattedPotonganLain = existingPotonganLain ? formatRupiahInput(String(existingPotonganLain)) : '';

            const existingKasbon = emp.payroll?.kasbon ?? 0;
            const formattedKasbon = existingKasbon ? formatRupiahInput(String(existingKasbon)) : '';

            initial[emp.id] = {
                hari_kerja: existingHariKerja,
                hari_tidak_masuk: hariTidakMasuk,
                jam_terlambat: emp.payroll?.jam_terlambat ?? 0,
                insentif: formattedInsentif,
                uang_hadir: formattedUangHadir,
                lembur: formattedLembur,
                reward: formattedReward,
                lain_lain: formattedLainLain,
                kasbon: formattedKasbon,
                tunjangan: tunjanganObj,
                potongan_lain: formattedPotonganLain,
                status: emp.payroll?.status ?? 'draft',
                gaji_pokok: emp.gaji_pokok ? formatRupiahInput(String(emp.gaji_pokok)) : '',
                tunjangan_jabatan: emp.tunjangan_jabatan ? formatRupiahInput(String(emp.tunjangan_jabatan)) : '',
            };
        });
        return initial;
    });

    // Calculate tunjangan based on percentage
    // Calculate potongan karyawan based on tunjangan perusahaan percentage
    const calculatePotonganKaryawan = (empId: number) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return {};

        const currentGaji = parseRupiah(String(formData[empId]?.gaji_pokok || 0));
        const potonganObj: Record<string, number> = {};

        tunjanganList.forEach((tunjangan) => {
            const key = String(Number(tunjangan.id));
            const karyawanPct = Number(tunjangan.karyawan) || 0;

            // Potongan karyawan dihitung dari Gaji Pokok (% karyawan * Gaji Pokok)
            potonganObj[key] = Math.round(currentGaji * karyawanPct / 100);
        });

        return potonganObj;
    };

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
        let total = parseRupiah(String(formData[empId]?.tunjangan_jabatan || 0));

        // Add insentif
        total += parseRupiah(String(formData[empId]?.insentif || 0));

        // Add uang hadir, lembur, reward, lain lain
        total += parseRupiah(String(formData[empId]?.uang_hadir || 0));
        total += parseRupiah(String(formData[empId]?.lembur || 0));
        total += parseRupiah(String(formData[empId]?.reward || 0));
        total += parseRupiah(String(formData[empId]?.lain_lain || 0));

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

        // Potongan = Tunjangan Perusahaan + Tunjangan Karyawan
        let totalTunjangan = 0;
        const tunjangan = formData[empId]?.tunjangan;
        if (tunjangan) {
            Object.values(tunjangan).forEach((t: { perusahaan: number; karyawan: number }) => {
                totalTunjangan += Number(t.perusahaan) || 0;
                totalTunjangan += Number(t.karyawan) || 0;
            });
        }

        // Add calculated tax
        const calculatedTax = getCalculatedTax(empId);

        return getPotonganTidakMasuk(empId) +
            getPotonganTerlambat(empId) +
            parseRupiah(String(formData[empId]?.kasbon || 0)) +
            parseRupiah(String(formData[empId]?.potongan_lain || 0)) +
            totalTunjangan +
            calculatedTax;
    };

    const getGajiBersih = (empId: number) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return 0;
        return parseRupiah(String(formData[empId]?.gaji_pokok || 0)) + getTotalTunjangan(empId) - getTotalPotongan(empId);
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
                uang_hadir: parseRupiah(String(data?.uang_hadir || 0)),
                lembur: parseRupiah(String(data?.lembur || 0)),
                reward: parseRupiah(String(data?.reward || 0)),
                lain_lain: parseRupiah(String(data?.lain_lain || 0)),
                tunjangan: tunjanganArray,
                kasbon: parseRupiah(String(data?.kasbon || 0)),
                potongan_lain: parseRupiah(String(data?.potongan_lain || 0)),
                status: publish ? 'published' : (data?.status || 'draft'),
                gaji_pokok: parseRupiah(String(data?.gaji_pokok || 0)),
                tunjangan_jabatan: parseRupiah(String(data?.tunjangan_jabatan || 0)),
            };
        });

        router.put(`/payroll/${bulan}`, {
            payroll: payrollData,
            publish: publish,
            status: status
        }, {
            onFinish: () => setSaving(false),
        });
    };

    const totalGajiPokok = employees.reduce((sum, e) => sum + parseRupiah(String(formData[e.id]?.gaji_pokok || 0)), 0);
    const totalInsentif = employees.reduce((sum, e) => sum + parseRupiah(String(formData[e.id]?.insentif || 0)), 0);

    const totalTunjangan = employees.reduce((sum, e) => sum + getTotalTunjangan(e.id), 0);
    const totalPotongan = employees.reduce((sum, e) => sum + getTotalPotongan(e.id), 0);
    const totalGajiBersih = employees.reduce((sum, e) => sum + getGajiBersih(e.id), 0);

    const tunjanganCols = tunjanganList || [];

    // Total pendapatan excluding JHT (id=8) and Pensiun (id=5), minus absen (tidak masuk + terlambat)
    const totalPendapatanKenaPajak = employees.reduce((sum, e) => {
        const emp = employees.find(emp => emp.id === e.id);
        const gajiPokok = parseRupiah(String(formData[e.id]?.gaji_pokok || 0));
        const tunjanganJabatan = parseRupiah(String(formData[e.id]?.tunjangan_jabatan || 0));
        const insentif = parseRupiah(String(formData[e.id]?.insentif || 0));
        const uangHadir = parseRupiah(String(formData[e.id]?.uang_hadir || 0));
        const lembur = parseRupiah(String(formData[e.id]?.lembur || 0));
        const reward = parseRupiah(String(formData[e.id]?.reward || 0));
        const lainLain = parseRupiah(String(formData[e.id]?.lain_lain || 0));

        // Potongan tidak masuk
        const hariTidakMasuk = formData[e.id]?.hari_tidak_masuk || 0;
        const potonganTidakMasuk = hariTidakMasuk * (Number(emp?.potongan_tidak_masuk) || 0);

        // Potongan terlambat
        const jamTerlambat = formData[e.id]?.jam_terlambat || 0;
        const potonganTerlambat = jamTerlambat * (Number(emp?.potongan_terlambat) || 0);

        const totalPotonganAbsen = potonganTidakMasuk + potonganTerlambat;

        let tunjanganPajak = 0;
        const tunjangan = formData[e.id]?.tunjangan;
        if (tunjangan) {
            Object.entries(tunjangan).forEach(([id, t]: [string, { perusahaan: number; karyawan: number }]) => {
                if (id !== '2' && id !== '5') {
                    tunjanganPajak += Number(t.perusahaan) || 0;
                }
            });
        }

        // TJ Perusahaan - absen (tidak masuk + terlambat)
        const tjPerusahaanMinAbsen = Math.max(0, tunjanganPajak - totalPotonganAbsen);

        return sum + gajiPokok + tunjanganJabatan + insentif + uangHadir + lembur + reward + lainLain + tjPerusahaanMinAbsen;
    }, 0);

    // Total tidak masuk / potongan tidak masuk
    const totalTidakMasuk = employees.reduce((sum, e) => {
        const emp = employees.find(emp => emp.id === e.id);
        if (!emp) return sum;
        const hariTidakMasuk = formData[e.id]?.hari_tidak_masuk || 0;
        return sum + (hariTidakMasuk * (Number(emp.potongan_tidak_masuk) || 0));
    }, 0);

    // Total pajak
    const totalPajak = employees.reduce((sum, e) => sum + getCalculatedTax(e.id), 0);

    // Persentase pajak rata-rata
    const persenpajak = totalPendapatanKenaPajak > 0
        ? ((totalPajak / totalPendapatanKenaPajak) * 100).toFixed(2)
        : '0.00';


    console.log({
        'penghasilan exc: jht dan pensiun': totalPendapatanKenaPajak,
        'tidak masuk': totalTidakMasuk,
        'jumlah % pajak': persenpajak,
        'detail per employee': employees.map(e => {
            const emp = employees.find(emp => emp.id === e.id);
            const gajiPokok = parseRupiah(String(formData[e.id]?.gaji_pokok || 0));
            const tunjanganJabatan = parseRupiah(String(formData[e.id]?.tunjangan_jabatan || 0));
            const insentif = parseRupiah(String(formData[e.id]?.insentif || 0));
            const uangHadir = parseRupiah(String(formData[e.id]?.uang_hadir || 0));
            const lembur = parseRupiah(String(formData[e.id]?.lembur || 0));
            const reward = parseRupiah(String(formData[e.id]?.reward || 0));
            const lainLain = parseRupiah(String(formData[e.id]?.lain_lain || 0));

            // Potongan tidak masuk
            const hariTidakMasuk = formData[e.id]?.hari_tidak_masuk || 0;
            const potonganTidakMasuk = hariTidakMasuk * (Number(emp?.potongan_tidak_masuk) || 0);

            // Potongan terlambat
            const jamTerlambat = formData[e.id]?.jam_terlambat || 0;
            const potonganTerlambat = jamTerlambat * (Number(emp?.potongan_terlambat) || 0);

            const totalPotonganAbsen = potonganTidakMasuk + potonganTerlambat;

            let tunjanganPajak = 0;
            const tunjangan = formData[e.id]?.tunjangan;
            if (tunjangan) {
                Object.entries(tunjangan).forEach(([id, t]: [string, { perusahaan: number; karyawan: number }]) => {
                    if (id !== '2' && id !== '5') {
                        tunjanganPajak += Number(t.perusahaan) || 0;
                    }
                });
            }

            // TJ Perusahaan - absen (tidak masuk + terlambat)
            const tjPerusahaanMinAbsen = Math.max(0, tunjanganPajak - totalPotonganAbsen);

            return {
                nama: emp?.nama,
                gp: gajiPokok,
                tj: tunjanganJabatan,
                ins: insentif,
                uh: uangHadir,
                lembur: lembur,
                reward: reward,
                lain: lainLain,
                tjPerusahaan: tunjanganPajak,
                tjPerusahaanMinAbsen: tjPerusahaanMinAbsen,
                totalAbsen: totalPotonganAbsen,
                totalMinTpPerus: gajiPokok + tunjanganJabatan + insentif + uangHadir + lembur + reward + lainLain,
                totalPlusPerus: gajiPokok + tunjanganJabatan + insentif + uangHadir + lembur + reward + lainLain + tunjanganPajak,
                totalMinAbsen: gajiPokok + tunjanganJabatan + insentif + uangHadir + lembur + reward + lainLain + tunjanganPajak - totalPotonganAbsen,
                pajakRate: (() => {
                    const pkp = gajiPokok + tunjanganJabatan + insentif + uangHadir + lembur + reward + lainLain + tjPerusahaanMinAbsen;
                    const taxResult = calculateTax(pkp, emp?.ptkp || 'TK/0');
                    return taxResult;
                })(),
                persenKenaPaja: (() => {
                    const pkp = gajiPokok + tunjanganJabatan + insentif + uangHadir + lembur + reward + lainLain + tjPerusahaanMinAbsen;
                    const taxResult = calculateTax(pkp, emp?.ptkp || 'TK/0');
                    return taxResult.rate.toFixed(2);
                })(),
                totalPajakditerima: (() => {
                    const pkp = gajiPokok + tunjanganJabatan + insentif + uangHadir + lembur + reward + lainLain + tjPerusahaanMinAbsen;
                    const taxResult = calculateTax(pkp, emp?.ptkp || 'TK/0');
                    return taxResult.tax;
                })(),
            };
        })
    });

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
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">
                                Payroll {formatBulan(bulan)}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
                                    {status}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                    {filteredEmployees.length} / {employees.length} Karyawan
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50"
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

                {/* Filter Section */}
                <div className="mb-4 flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Filter NIP</label>
                        <input
                            type="text"
                            value={filterNip}
                            onChange={(e) => setFilterNip(e.target.value)}
                            placeholder="Cari NIP..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Filter Cabang</label>
                        <select
                            value={filterCabang}
                            onChange={(e) => setFilterCabang(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Semua Cabang</option>
                            {[...new Set(employees.map(e => e.kantorCabang))].map(cabang => (
                                <option key={cabang} value={cabang}>{cabang}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => { setFilterNip(''); setFilterCabang(''); }}
                        className="mt-5 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
                    >
                        Reset
                    </button>
                </div>

                {/* Table dengan Fixed Columns - Single scrollable wrapper */}
                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
                    <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        {/* Tabel Fixed (kolom kiri yang tidak akan bergerak) */}
                        <div className="inline-block border-r-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 align-top">
                            <table className='w-auto'>
                                <thead className='bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800'>
                                    <tr>
                                        <th className='px-2 py-3 text-center text-xs font-bold text-white w-10'>#</th>
                                        <th className='px-3 py-3 text-left text-xs font-bold text-white min-w-[150px] cursor-pointer hover:bg-blue-600/50' onClick={() => handleSort('nama')}>
                                            <div className='flex items-center gap-1'>
                                                Nama
                                                {sortField === 'nama' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </div>
                                        </th>
                                        <th className='px-3 py-3 text-left text-xs font-bold text-white min-w-[120px] cursor-pointer hover:bg-blue-600/50' onClick={() => handleSort('nip')}>
                                            <div className='flex items-center gap-1'>
                                                NIP
                                                {sortField === 'nip' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </div>
                                        </th>
                                        <th className='px-3 py-3 text-left text-xs font-bold text-white min-w-[120px] cursor-pointer hover:bg-blue-600/50' onClick={() => handleSort('kantorCabang')}>
                                            <div className='flex items-center gap-1'>
                                                Cabang
                                                {sortField === 'kantorCabang' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </div>
                                        </th>
                                        <th className='px-3 py-3 text-right text-xs font-bold text-white'>Gaji Pokok</th>
                                        <th className='px-3 py-3 text-right text-xs font-bold text-white'>Tunjangan</th>
                                        <th className='px-3 py-3 text-right text-xs font-bold text-white'>Insentif</th>
                                        <th className='px-1 py-3 text-right text-xs font-bold text-white'>Uang Hadir</th>
                                        <th className='px-1 py-3 text-right text-xs font-bold text-white'>Lembur</th>
                                        <th className='px-1 py-3 text-right text-xs font-bold text-white'>Reward</th>
                                        <th className='px-1 py-3 text-right text-xs font-bold text-white'>Lain-Lain</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                                    {/* Footer row - TOTAL */}
                                    <tr className="bg-gray-100 dark:bg-gray-800 font-bold">
                                        <td colSpan={4} className="px-3 py-4 text-right text-gray-900 dark:text-white">TOTAL</td>
                                        <td className="px-3 py-4 text-right text-gray-900 dark:text-white">{formatCurrency(totalGajiPokok)}</td>
                                        <td className="px-3 py-4 text-right text-green-600">{formatCurrency(employees.reduce((sum, e) => sum + parseRupiah(String(formData[e.id]?.tunjangan_jabatan || 0)), 0))}</td>
                                        <td className="px-3 py-4 text-right text-green-600">{formatCurrency(totalInsentif)}</td>
                                        <td className="px-1 py-4 text-right text-green-600 text-sm">{formatCurrency(employees.reduce((sum, e) => sum + parseRupiah(String(formData[e.id]?.uang_hadir || 0)), 0))}</td>
                                        <td className="px-1 py-4 text-right text-green-600 text-sm">{formatCurrency(employees.reduce((sum, e) => sum + parseRupiah(String(formData[e.id]?.lembur || 0)), 0))}</td>
                                        <td className="px-1 py-4 text-right text-green-600 text-sm">{formatCurrency(employees.reduce((sum, e) => sum + parseRupiah(String(formData[e.id]?.reward || 0)), 0))}</td>
                                        <td className="px-1 py-4 text-right text-green-600 text-sm">{formatCurrency(employees.reduce((sum, e) => sum + parseRupiah(String(formData[e.id]?.lain_lain || 0)), 0))}</td>
                                    </tr>
                                    {sortedEmployees.map((employee, index) => (
                                        <tr key={employee.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50">
                                            <td className="px-2 py-3 text-center">
                                                <span className="inline-flex items-center justify-center size-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="font-semibold text-gray-900 dark:text-white text-sm">{employee.nama}</div>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">{employee.nip}</td>
                                            <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">{employee.kantorCabang}</td>
                                            <td className="px-3 py-3">
                                                <input
                                                    type="text"
                                                    value={formData[employee.id]?.gaji_pokok ?? ''}
                                                    onChange={(e) => {
                                                        const formatted = formatRupiahInput(e.target.value);
                                                        const newGaji = parseRupiah(formatted);
                                                        const newTunjangan: Record<string, { perusahaan: number; karyawan: number }> = {};
                                                        tunjanganList.forEach((tunjangan) => {
                                                            const key = String(Number(tunjangan.id));
                                                            const perusahaanPct = Number(tunjangan.perusahaan) || 0;
                                                            const karyawanPct = Number(tunjangan.karyawan) || 0;
                                                            const tunjanganPerusahaan = Math.round(newGaji * perusahaanPct / 100);
                                                            const tunjanganKaryawan = Math.round(newGaji * karyawanPct / 100);
                                                            newTunjangan[key] = { perusahaan: tunjanganPerusahaan, karyawan: tunjanganKaryawan };
                                                        });
                                                        setFormData({ ...formData, [employee.id]: { ...formData[employee.id], gaji_pokok: formatted, tunjangan: newTunjangan } });
                                                    }}
                                                    className="w-28 px-2 py-1 text-right text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-3 py-3">
                                                <input
                                                    type="text"
                                                    value={formData[employee.id]?.tunjangan_jabatan ?? ''}
                                                    onChange={(e) => setFormData({ ...formData, [employee.id]: { ...formData[employee.id], tunjangan_jabatan: formatRupiahInput(e.target.value) } })}
                                                    className="w-28 px-2 py-1 text-right text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-3 py-3">
                                                <input
                                                    type="text"
                                                    value={formData[employee.id]?.insentif ?? ''}
                                                    onChange={(e) => setFormData({ ...formData, [employee.id]: { ...formData[employee.id], insentif: formatRupiahInput(e.target.value) } })}
                                                    className="w-28 px-2 py-1 text-right text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-1 py-3">
                                                <input
                                                    type="text"
                                                    value={formData[employee.id]?.uang_hadir ?? ''}
                                                    onChange={(e) => setFormData({ ...formData, [employee.id]: { ...formData[employee.id], uang_hadir: formatRupiahInput(e.target.value) } })}
                                                    className="w-20 px-1 py-1 text-right text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-1 py-3">
                                                <input
                                                    type="text"
                                                    value={formData[employee.id]?.lembur ?? ''}
                                                    onChange={(e) => setFormData({ ...formData, [employee.id]: { ...formData[employee.id], lembur: formatRupiahInput(e.target.value) } })}
                                                    className="w-20 px-1 py-1 text-right text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-1 py-3">
                                                <input
                                                    type="text"
                                                    value={formData[employee.id]?.reward ?? ''}
                                                    onChange={(e) => setFormData({ ...formData, [employee.id]: { ...formData[employee.id], reward: formatRupiahInput(e.target.value) } })}
                                                    className="w-20 px-1 py-1 text-right text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-1 py-3">
                                                <input
                                                    type="text"
                                                    value={formData[employee.id]?.lain_lain ?? ''}
                                                    onChange={(e) => setFormData({ ...formData, [employee.id]: { ...formData[employee.id], lain_lain: formatRupiahInput(e.target.value) } })}
                                                    className="w-20 px-1 py-1 text-right text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500"
                                                    placeholder="0"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Tabel Scrollable (kolom kanan yang bisa di-scroll) */}
                        <div className="inline-block align-top">
                            <table className='w-full'>
                                <thead className='bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 sticky top-0 z-30'>
                                    <tr>
                                        <th className='px-3 py-3 text-center text-xs font-bold text-white' colSpan={tunjanganCols.length}>TUNJANGAN (PERUSAHAAN)</th>
                                        <th className='px-3 py-3 text-right text-xs font-bold text-white'>Mangkir</th>
                                        <th className='px-3 py-3 text-right text-xs font-bold text-white'>Terlambat</th>
                                        <th className='px-3 py-3 text-right text-xs font-bold text-white'>Kasbon</th>
                                        <th className='px-3 py-3 text-right text-xs font-bold text-white'>Potongan Lain</th>
                                        <th className='px-3 py-3 text-right text-xs font-bold text-white bg-orange-500'>Pajak</th>
                                        <th className='px-3 py-3 text-center text-xs font-bold text-white' colSpan={tunjanganCols.length * 2}>TUNJANGAN KARYAWAN & POTONGAN</th>
                                        <th className='px-3 py-3 text-right text-xs font-bold text-white'>Total Pendapatan</th>
                                        <th className='px-3 py-3 text-right text-xs font-bold text-white'>Total Pengurangan</th>
                                        <th className='px-3 py-3 text-right text-xs font-bold text-white'>Total</th>
                                    </tr>
                                    <tr>
                                        {tunjanganCols.map((t: TunjanganList) => (
                                            <th key={t.id} className='px-2 py-2 text-right text-xs font-bold text-white bg-blue-400 dark:bg-blue-600 min-w-[80px]'>{t.jenis_tunjangan}</th>
                                        ))}
                                        {tunjanganCols.map((t: TunjanganList) => (
                                            <th key={t.id + '_tj'} className='px-1 py-2 text-right text-xs font-bold text-white bg-purple-400 dark:bg-purple-600 min-w-[70px]'>TJ {t.jenis_tunjangan}</th>
                                        ))}
                                        {tunjanganCols.map((t: TunjanganList) => (
                                            <th key={t.id + '_pot'} className='px-1 py-2 text-right text-xs font-bold text-white bg-red-400 dark:bg-red-600 min-w-[70px]'>Potongan</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                                    {/* Footer row - antara header dan body */}
                                    <tr className="bg-gray-100 dark:bg-gray-800 font-bold">
                                        {tunjanganCols.map((t: TunjanganList) => {
                                            const tunjanganKey = String(Number(t.id));
                                            const totalPerusahaan = sortedEmployees.reduce((sum, e) => {
                                                if (!isTunjanganEnabled(e, Number(t.id))) return sum;
                                                return sum + (formData[e.id]?.tunjangan?.[tunjanganKey]?.perusahaan || 0);
                                            }, 0);
                                            return (
                                                <td key={t.id} className="px-2 py-4 text-right text-green-600 text-sm">{formatCurrency(totalPerusahaan)}</td>
                                            );
                                        })}
                                        <td className="px-3 py-4"></td>
                                        <td className="px-3 py-4"></td>
                                        <td className="px-3 py-4"></td>
                                        <td className="px-3 py-4"></td>
                                        <td className="px-3 py-4 text-right text-orange-600">{formatCurrency(sortedEmployees.reduce((sum, e) => sum + getCalculatedTax(e.id), 0))}</td>
                                        {tunjanganCols.map((t: TunjanganList) => {
                                            const karyawanPercent = t.karyawan || 0;
                                            const totalTjKaryawan = sortedEmployees.reduce((sum, e) => {
                                                if (!isTunjanganEnabled(e, Number(t.id))) return sum;
                                                return sum + Math.round(parseRupiah(String(formData[e.id]?.gaji_pokok || 0)) * karyawanPercent / 100);
                                            }, 0);
                                            return (
                                                <td key={t.id + '_tj'} className="px-1 py-4 text-right text-purple-600 text-xs">{formatCurrency(totalTjKaryawan)}</td>
                                            );
                                        })}
                                        {tunjanganCols.map((t: TunjanganList) => {
                                            const tunjanganKey = String(Number(t.id));
                                            const totalPotongan = sortedEmployees.reduce((sum, e) => {
                                                if (!isTunjanganEnabled(e, Number(t.id))) return sum;
                                                const perusahaan = formData[e.id]?.tunjangan?.[tunjanganKey]?.perusahaan || 0;
                                                const tjKaryawan = Math.round(parseRupiah(String(formData[e.id]?.gaji_pokok || 0)) * (t.karyawan || 0) / 100);
                                                return sum + perusahaan + tjKaryawan;
                                            }, 0);
                                            return (
                                                <td key={t.id + '_pot'} className="px-1 py-4 text-right text-red-600 text-xs">{formatCurrency(totalPotongan)}</td>
                                            );
                                        })}
                                        <td className="px-3 py-4 text-right text-green-600">{formatCurrency(totalTunjangan + totalGajiPokok)}</td>
                                        <td className="px-3 py-4 text-right text-red-600">{formatCurrency(totalPotongan)}</td>
                                        <td className="px-3 py-4 text-right text-blue-600">{formatCurrency(totalGajiBersih)}</td>
                                    </tr>
                                    {sortedEmployees.map((employee, index) => {
                                        const empGajiBersih = getGajiBersih(employee.id);
                                        // Filter tunjangan yang tidak di-checklist
                                        const enabledTunjangan = tunjanganCols.filter((t) => isTunjanganEnabled(employee, Number(t.id)));
                                        return (
                                            <tr key={employee.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50">
                                                {enabledTunjangan.map((t: TunjanganList) => {
                                                    const tunjanganKey = String(Number(t.id));
                                                    const currentValue = formData[employee.id]?.tunjangan?.[tunjanganKey]?.perusahaan || 0;
                                                    return (
                                                        <td key={t.id} className="px-2 py-3 bg-green-50/30 dark:bg-green-900/10">
                                                            <input
                                                                type="text"
                                                                value={currentValue === 0 ? '' : formatRupiahInput(String(currentValue))}
                                                                onChange={(e) => {
                                                                    const formatted = formatRupiahInput(e.target.value);
                                                                    const newValue = parseRupiah(formatted);
                                                                    const currentGaji = parseRupiah(String(formData[employee.id]?.gaji_pokok || 0));
                                                                    const karyawanPct = Number(t.karyawan) || 0;
                                                                    const newPotonganKaryawan = Math.round(currentGaji * karyawanPct / 100);
                                                                    setFormData({
                                                                        ...formData,
                                                                        [employee.id]: {
                                                                            ...formData[employee.id],
                                                                            tunjangan: {
                                                                                ...formData[employee.id].tunjangan,
                                                                                [tunjanganKey]: { ...formData[employee.id].tunjangan?.[tunjanganKey], perusahaan: newValue, karyawan: newPotonganKaryawan }
                                                                            }
                                                                        }
                                                                    });
                                                                }}
                                                                className="w-20 px-1 py-1 text-right text-sm rounded border border-green-200 dark:border-green-800 bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500"
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                    );
                                                })}
                                                {/* Placeholder cells for disabled tunjangan */}
                                                {tunjanganCols
                                                    .filter((t) => !isTunjanganEnabled(employee, Number(t.id)))
                                                    .map((t: TunjanganList) => (
                                                        <td key={t.id} className="px-2 py-3 bg-gray-100 dark:bg-gray-800"></td>
                                                    ))}
                                                <td className="px-3 py-3">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        value={formData[employee.id]?.hari_tidak_masuk === 0 ? '' : (formData[employee.id]?.hari_tidak_masuk ?? '')}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                                            setFormData({ ...formData, [employee.id]: { ...formData[employee.id], hari_tidak_masuk: val === '' ? 0 : parseInt(val) || 0 } });
                                                        }}
                                                        onFocus={(e) => e.target.select()}
                                                        className="w-14 px-2 py-1 text-center text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
                                                    />
                                                    <div className="text-xs text-red-500">{formatCurrency(getPotonganTidakMasuk(employee.id))}</div>
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        value={formData[employee.id]?.jam_terlambat === 0 ? '' : (formData[employee.id]?.jam_terlambat ?? '')}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                                            setFormData({ ...formData, [employee.id]: { ...formData[employee.id], jam_terlambat: val === '' ? 0 : parseInt(val) || 0 } });
                                                        }}
                                                        onFocus={(e) => e.target.select()}
                                                        className="w-14 px-2 py-1 text-center text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
                                                    />
                                                    <div className="text-xs text-red-500">{formatCurrency(getPotonganTerlambat(employee.id))}</div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <input
                                                        type="text"
                                                        value={formData[employee.id]?.kasbon ?? ''}
                                                        onChange={(e) => setFormData({ ...formData, [employee.id]: { ...formData[employee.id], kasbon: formatRupiahInput(e.target.value) } })}
                                                        className="w-28 px-2 py-1 text-right text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-3 py-3">
                                                    <input
                                                        type="text"
                                                        value={formData[employee.id]?.potongan_lain ?? ''}
                                                        onChange={(e) => setFormData({ ...formData, [employee.id]: { ...formData[employee.id], potongan_lain: formatRupiahInput(e.target.value) } })}
                                                        className="w-28 px-2 py-1 text-right text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-3 py-3 text-right text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20">{formatCurrency(getCalculatedTax(employee.id))}</td>
                                                {enabledTunjangan.map((t: TunjanganList) => {
                                                    const tunjanganKey = String(Number(t.id));
                                                    const perusahaan = formData[employee.id]?.tunjangan?.[tunjanganKey]?.perusahaan || 0;
                                                    const karyawanPercent = t.karyawan || 0;
                                                    const gajiPokok = parseRupiah(String(formData[employee.id]?.gaji_pokok || 0));
                                                    const tjKaryawan = Math.round(gajiPokok * karyawanPercent / 100);
                                                    return (
                                                        <td key={t.id + '_tj'} className="px-1 py-3 bg-purple-50/30 dark:bg-purple-900/10 text-right text-xs font-medium text-purple-700 dark:text-purple-400">{formatCurrency(tjKaryawan)}</td>
                                                    );
                                                })}
                                                {/* Placeholder for disabled TJ Karyawan */}
                                                {tunjanganCols
                                                    .filter((t) => !isTunjanganEnabled(employee, Number(t.id)))
                                                    .map((t: TunjanganList) => (
                                                        <td key={t.id + '_tj'} className="px-1 py-3 bg-gray-100 dark:bg-gray-800"></td>
                                                    ))}
                                                {enabledTunjangan.map((t: TunjanganList) => {
                                                    const tunjanganKey = String(Number(t.id));
                                                    const perusahaan = formData[employee.id]?.tunjangan?.[tunjanganKey]?.perusahaan || 0;
                                                    const karyawanPercent = t.karyawan || 0;
                                                    const gajiPokok = parseRupiah(String(formData[employee.id]?.gaji_pokok || 0));
                                                    const tjKaryawan = Math.round(gajiPokok * karyawanPercent / 100);
                                                    return (
                                                        <td key={t.id + '_pot'} className="px-1 py-3 bg-red-50/30 dark:bg-red-900/10 text-right text-xs font-medium text-red-700 dark:text-red-400">{formatCurrency(perusahaan + tjKaryawan)}</td>
                                                    );
                                                })}
                                                {/* Placeholder for disabled Potongan */}
                                                {tunjanganCols
                                                    .filter((t) => !isTunjanganEnabled(employee, Number(t.id)))
                                                    .map((t: TunjanganList) => (
                                                        <td key={t.id + '_pot'} className="px-1 py-3 bg-gray-100 dark:bg-gray-800"></td>
                                                    ))}
                                                <td className="px-3 py-3 text-right text-sm font-bold text-green-600">{formatCurrency(getTotalTunjangan(employee.id) + parseRupiah(String(formData[employee.id]?.gaji_pokok || 0)))}</td>
                                                <td className="px-3 py-3 text-right text-sm font-bold text-red-600">{formatCurrency(getTotalPotongan(employee.id))}</td>
                                                <td className="px-3 py-3 text-right text-sm font-bold text-blue-600">{formatCurrency(empGajiBersih)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
