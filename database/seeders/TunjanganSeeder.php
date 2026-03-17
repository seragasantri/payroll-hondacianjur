<?php

namespace Database\Seeders;

use App\Models\Tunjangan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TunjanganSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Tunjangan::create([
            'jenis_tunjangan' => 'BPJS Kesehatan',
            'perusahaan' => 4.00,
            'karyawan' => 1.00,
            'total' => 5.00,
        ]);

        Tunjangan::create([
            'jenis_tunjangan' => 'JHT',
            'perusahaan' => 3.70,
            'karyawan' => 2.00,
            'total' => 5.70,
        ]);

        Tunjangan::create([
            'jenis_tunjangan' => 'JKK',
            'perusahaan' => 0.24,
            'karyawan' => 0.00,
            'total' => 0.24,
        ]);

        Tunjangan::create([
            'jenis_tunjangan' => 'JKM',
            'perusahaan' => 0.30,
            'karyawan' => 0.00,
            'total' => 0.30,
        ]);

        Tunjangan::create([
            'jenis_tunjangan' => 'Pensiun',
            'perusahaan' => 2.00,
            'karyawan' => 1.00,
            'total' => 3.00,
        ]);
    }
}