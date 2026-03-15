<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TaxPtkpSetting;
use App\Models\TaxTerRate;
use App\Models\TaxArticle17Rate;

class TaxSystemSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Data PTKP
        $ptkp = [
            ['ptkp_code' => 'TK/0', 'amount' => 54000000, 'ter_category' => 'A'],
            ['ptkp_code' => 'TK/1', 'amount' => 58500000, 'ter_category' => 'A'],
            ['ptkp_code' => 'K/0',  'amount' => 58500000, 'ter_category' => 'A'],
            ['ptkp_code' => 'TK/2', 'amount' => 63000000, 'ter_category' => 'B'],
            ['ptkp_code' => 'TK/3', 'amount' => 67500000, 'ter_category' => 'B'],
            ['ptkp_code' => 'K/1',  'amount' => 63000000, 'ter_category' => 'B'],
            ['ptkp_code' => 'K/2',  'amount' => 67500000, 'ter_category' => 'B'],
            ['ptkp_code' => 'K/3',  'amount' => 72000000, 'ter_category' => 'C'],
        ];
        foreach ($ptkp as $p) TaxPtkpSetting::create($p);

        // 2. Data Pasal 17 (Tarif Progresif)
        $pasal17 = [
            ['min_pkp' => 0, 'max_pkp' => 60000000, 'percentage' => 5],
            ['min_pkp' => 60000001, 'max_pkp' => 250000000, 'percentage' => 15],
            ['min_pkp' => 250000001, 'max_pkp' => 500000000, 'percentage' => 25],
            ['min_pkp' => 500000001, 'max_pkp' => 5000000000, 'percentage' => 30],
            ['min_pkp' => 5000000001, 'max_pkp' => null, 'percentage' => 35],
        ];
        foreach ($pasal17 as $p17) TaxArticle17Rate::create($p17);

        // 3. Data TER Kategori A (Sesuai Baris 2-24 Excel)
        $terA = [
            ['category' => 'A', 'min_gross' => 0, 'max_gross' => 5400000, 'percentage' => 0],
            ['category' => 'A', 'min_gross' => 5400001, 'max_gross' => 5650000, 'percentage' => 0.25],
            ['category' => 'A', 'min_gross' => 5650001, 'max_gross' => 5950000, 'percentage' => 0.5],
            ['category' => 'A', 'min_gross' => 5950001, 'max_gross' => 6300000, 'percentage' => 0.75],
            ['category' => 'A', 'min_gross' => 6300001, 'max_gross' => 6750000, 'percentage' => 1.0],
            ['category' => 'A', 'min_gross' => 6750001, 'max_gross' => 7500000, 'percentage' => 1.25],
            ['category' => 'A', 'min_gross' => 7500001, 'max_gross' => 8550000, 'percentage' => 1.5],
            ['category' => 'A', 'min_gross' => 8550001, 'max_gross' => 9650000, 'percentage' => 1.75],
            ['category' => 'A', 'min_gross' => 9650001, 'max_gross' => 10050000, 'percentage' => 2.0],
            ['category' => 'A', 'min_gross' => 10050001, 'max_gross' => 10350000, 'percentage' => 2.25],
            ['category' => 'A', 'min_gross' => 10350001, 'max_gross' => 10700000, 'percentage' => 2.5],
            ['category' => 'A', 'min_gross' => 10700001, 'max_gross' => 11050000, 'percentage' => 3.0],
            ['category' => 'A', 'min_gross' => 11050001, 'max_gross' => 11600000, 'percentage' => 3.5],
            ['category' => 'A', 'min_gross' => 11600001, 'max_gross' => 12500000, 'percentage' => 4.0],
            ['category' => 'A', 'min_gross' => 12500001, 'max_gross' => 13750000, 'percentage' => 5.0],
            ['category' => 'A', 'min_gross' => 13750001, 'max_gross' => 15100000, 'percentage' => 6.0],
            ['category' => 'A', 'min_gross' => 15100001, 'max_gross' => 16950000, 'percentage' => 7.0],
            ['category' => 'A', 'min_gross' => 16950001, 'max_gross' => 19750000, 'percentage' => 8.0],
            ['category' => 'A', 'min_gross' => 19750001, 'max_gross' => 24150000, 'percentage' => 9.0],
            ['category' => 'A', 'min_gross' => 24150001, 'max_gross' => 26450000, 'percentage' => 10.0],
            ['category' => 'A', 'min_gross' => 26450001, 'max_gross' => 28000000, 'percentage' => 11.0],
            ['category' => 'A', 'min_gross' => 28000001, 'max_gross' => 30050000, 'percentage' => 12.0],
            ['category' => 'A', 'min_gross' => 30050001, 'max_gross' => 32400000, 'percentage' => 13.0],
        ];
        foreach ($terA as $t) TaxTerRate::create($t);

        // 4. Data TER Kategori B (Sesuai Baris 28-45 Excel)
        $terB = [
            ['category' => 'B', 'min_gross' => 0, 'max_gross' => 6200000, 'percentage' => 0],
            ['category' => 'B', 'min_gross' => 6200001, 'max_gross' => 6500000, 'percentage' => 0.25],
            ['category' => 'B', 'min_gross' => 6500001, 'max_gross' => 6850000, 'percentage' => 0.5],
            ['category' => 'B', 'min_gross' => 6850001, 'max_gross' => 7300000, 'percentage' => 0.75],
            ['category' => 'B', 'min_gross' => 7300001, 'max_gross' => 9200000, 'percentage' => 1.0],
            ['category' => 'B', 'min_gross' => 9200001, 'max_gross' => 10750000, 'percentage' => 1.5],
            ['category' => 'B', 'min_gross' => 10750001, 'max_gross' => 11250000, 'percentage' => 2.0],
            ['category' => 'B', 'min_gross' => 11250001, 'max_gross' => 11600000, 'percentage' => 2.5],
            ['category' => 'B', 'min_gross' => 11600001, 'max_gross' => 12600000, 'percentage' => 3.0],
            ['category' => 'B', 'min_gross' => 12600001, 'max_gross' => 13600000, 'percentage' => 4.0],
            ['category' => 'B', 'min_gross' => 13600001, 'max_gross' => 14950000, 'percentage' => 5.0],
            ['category' => 'B', 'min_gross' => 14950001, 'max_gross' => 16400000, 'percentage' => 6.0],
            ['category' => 'B', 'min_gross' => 16400001, 'max_gross' => 18450000, 'percentage' => 7.0],
            ['category' => 'B', 'min_gross' => 18450001, 'max_gross' => 21850000, 'percentage' => 8.0],
            ['category' => 'B', 'min_gross' => 21850001, 'max_gross' => 26000000, 'percentage' => 9.0],
            ['category' => 'B', 'min_gross' => 26000001, 'max_gross' => 27700000, 'percentage' => 10.0],
            ['category' => 'B', 'min_gross' => 27700001, 'max_gross' => 29350000, 'percentage' => 11.0],
            ['category' => 'B', 'min_gross' => 29350001, 'max_gross' => 31450000, 'percentage' => 12.0],
        ];
        foreach ($terB as $t) TaxTerRate::create($t);

        // 5. Data TER Kategori C (Sesuai Baris 49-67 Excel)
        $terC = [
            ['category' => 'C', 'min_gross' => 0, 'max_gross' => 6600000, 'percentage' => 0],
            ['category' => 'C', 'min_gross' => 6600001, 'max_gross' => 6950000, 'percentage' => 0.25],
            ['category' => 'C', 'min_gross' => 6950001, 'max_gross' => 7350000, 'percentage' => 0.5],
            ['category' => 'C', 'min_gross' => 7350001, 'max_gross' => 7800000, 'percentage' => 0.75],
            ['category' => 'C', 'min_gross' => 7800001, 'max_gross' => 8850000, 'percentage' => 1.0],
            ['category' => 'C', 'min_gross' => 8850001, 'max_gross' => 9800000, 'percentage' => 1.25],
            ['category' => 'C', 'min_gross' => 9800001, 'max_gross' => 10950000, 'percentage' => 1.5],
            ['category' => 'C', 'min_gross' => 10950001, 'max_gross' => 11200000, 'percentage' => 1.75],
            ['category' => 'C', 'min_gross' => 11200001, 'max_gross' => 12050000, 'percentage' => 2.0],
            ['category' => 'C', 'min_gross' => 12050001, 'max_gross' => 12950000, 'percentage' => 3.0],
            ['category' => 'C', 'min_gross' => 12950001, 'max_gross' => 14150000, 'percentage' => 4.0],
            ['category' => 'C', 'min_gross' => 14150001, 'max_gross' => 15550000, 'percentage' => 5.0],
            ['category' => 'C', 'min_gross' => 15550001, 'max_gross' => 17050000, 'percentage' => 6.0],
            ['category' => 'C', 'min_gross' => 17050001, 'max_gross' => 19500000, 'percentage' => 7.0],
            ['category' => 'C', 'min_gross' => 19500001, 'max_gross' => 22700000, 'percentage' => 8.0],
            ['category' => 'C', 'min_gross' => 22700001, 'max_gross' => 26600000, 'percentage' => 9.0],
            ['category' => 'C', 'min_gross' => 26600001, 'max_gross' => 28100000, 'percentage' => 10.0],
            ['category' => 'C', 'min_gross' => 28100001, 'max_gross' => 30100000, 'percentage' => 11.0],
            ['category' => 'C', 'min_gross' => 30100001, 'max_gross' => 32600000, 'percentage' => 12.0],
        ];
        foreach ($terC as $t) TaxTerRate::create($t);
    }
}
