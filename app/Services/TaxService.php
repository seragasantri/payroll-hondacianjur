<?php

namespace App\Services;

use App\Models\TaxPtkpSetting;
use App\Models\TaxTerRate;
use App\Models\TaxArticle17Rate;

class TaxService
{
    /**
     * Hitung PPh21 menggunakan metode TER (Tarif Efektif Rata-rata)
     *
     * @param float $gajiGross Bulanan gross salary
     * @param string $ptkpCode Kode PTKP (TK/0, K/1, dll)
     * @return array ['pph21_bulanan' => float, 'tarif_ter' => float, 'ptkp' => float]
     */
    public function hitungTER(float $gajiGross, string $ptkpCode): array
    {
        // 1. Cari data PTKP
        $ptkp = TaxPtkpSetting::where('ptkp_code', $ptkpCode)->first();

        if (!$ptkp) {
            return [
                'pph21_bulanan' => 0,
                'tarif_ter' => 0,
                'ptkp' => 0,
                'method' => 'TER'
            ];
        }

        // 2. Cari tarif TER berdasarkan kategori dan gross bulanan
        $terRate = TaxTerRate::where('category', $ptkp->ter_category)
            ->where('min_gross', '<=', $gajiGross)
            ->where(function ($query) use ($gajiGross) {
                $query->where('max_gross', '>=', $gajiGross)
                    ->orWhereNull('max_gross');
            })
            ->first();

        $tarifTer = $terRate ? $terRate->percentage / 100 : 0;

        // 3. Hitung PPh21 bulanan = Gross × Tarif TER
        $pph21Bulanan = $gajiGross * $tarifTer;

        return [
            'pph21_bulanan' => round($pph21Bulanan),
            'tarif_ter' => $tarifTer * 100, // Dalam persen
            'ptkp' => $ptkp->amount,
            'method' => 'TER'
        ];
    }

    /**
     * Hitung PPh21 menggunakan metode Pasal 17 (Tarif Progresif)
     *
     * @param float $gajiGross Bulanan gross salary
     * @param string $ptkpCode Kode PTKP (TK/0, K/1, dll)
     * @return array ['pph21_bulanan' => float, 'tarif_pasal17' => float, 'ptkp' => float, 'pkp_tahunan' => float]
     */
    public function hitungPasal17(float $gajiGross, string $ptkpCode): array
    {
        // 1. Cari data PTKP
        $ptkp = TaxPtkpSetting::where('ptkp_code', $ptkpCode)->first();

        if (!$ptkp) {
            return [
                'pph21_bulanan' => 0,
                'tarif_pasal17' => 0,
                'ptkp' => 0,
                'pkp_tahunan' => 0,
                'method' => 'Pasal17'
            ];
        }

        // 2. Hitung gross tahunan
        $grossTahunan = $gajiGross * 12;

        // 3. Hitung PKP (Penghasilan Kena Pajak) = Gross Tahunan - PTKP
        $pkpTahunan = max(0, $grossTahunan - $ptkp->amount);

        // 4. Cari tarif Pasal 17 berdasarkan PKP
        $pasal17Rate = TaxArticle17Rate::where('min_pkp', '<=', $pkpTahunan)
            ->where(function ($query) use ($pkpTahunan) {
                $query->where('max_pkp', '>=', $pkpTahunan)
                    ->orWhereNull('max_pkp');
            })
            ->first();

        $tarifPasal17 = $pasal17Rate ? $pasal17Rate->percentage / 100 : 0;

        // 5. Hitung PPh21 tahunan = PKP × Tarif Pasal 17
        $pph21Tahunan = $pkpTahunan * $tarifPasal17;

        // 6. PPh21 bulanan = PPh21 Tahunan / 12
        $pph21Bulanan = $pph21Tahunan / 12;

        return [
            'pph21_bulanan' => round($pph21Bulanan),
            'tarif_pasal17' => $tarifPasal17 * 100, // Dalam persen
            'ptkp' => $ptkp->amount,
            'pkp_tahunan' => $pkpTahunan,
            'method' => 'Pasal17'
        ];
    }

    /**
     * Hitung PPh21 dengan membandingkan TER dan Pasal 17
     * Menggunakan metode yang menghasilkan pajak lebih kecil
     *
     * @param float $gajiGross Bulanan gross salary
     * @param string $ptkpCode Kode PTKP
     * @return array
     */
    public function hitungPPh21(float $gajiGross, string $ptkpCode): array
    {
        // Hitung dengan metode TER
        $hasilTER = $this->hitungTER($gajiGross, $ptkpCode);

        // Hitung dengan metode Pasal 17
        $hasilPasal17 = $this->hitungPasal17($gajiGross, $ptkpCode);

        // Pilih metode dengan pajak lebih kecil
        if ($hasilPasal17['pph21_bulanan'] < $hasilTER['pph21_bulanan']) {
            return [
                'pph21_bulanan' => $hasilPasal17['pph21_bulanan'],
                'tarif' => $hasilPasal17['tarif_pasal17'],
                'ptkp' => $hasilPasal17['ptkp'],
                'method' => 'Pasul17',
                'pkp_tahunan' => $hasilPasal17['pkp_tahunan'] ?? 0
            ];
        }

        return [
            'pph21_bulanan' => $hasilTER['pph21_bulanan'],
            'tarif' => $hasilTER['tarif_ter'],
            'ptkp' => $hasilTER['ptkp'],
            'method' => 'TER',
            'pkp_tahunan' => 0
        ];
    }

    /**
     * Ambil semua data PTKP
     */
    public function getAllPtkp()
    {
        return TaxPtkpSetting::orderBy('ptkp_code')->get();
    }

    /**
     * Ambil semua data TER rate
     */
    public function getAllTerRates()
    {
        return TaxTerRate::orderBy('category')->orderBy('min_gross')->get();
    }

    /**
     * Ambil semua data Pasal 17 rate
     */
    public function getAllPasal17Rates()
    {
        return TaxArticle17Rate::orderBy('min_pkp')->get();
    }
}
