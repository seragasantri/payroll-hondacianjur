<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payroll extends Model
{
    use HasFactory;

    protected $table = 'payroll';
    protected $fillable = [
        'employee_id',
        'bulan',
        'hari_kerja',
        'hari_masuk',
        'jam_terlambat',
        'gaji_pokok',
        'tunjangan_jabatan',
        'insentif',
        'tunjangan_lain',
        'potongan_tidak_masuk',
        'potongan_terlambat',
        'potongan_lain',
        'total_gaji',
        'total_potongan',
        'gaji_bersih',
        'status',
        'tanggal_pembayaran',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'gaji_pokok' => 'decimal:2',
        'tunjangan_jabatan' => 'decimal:2',
        'insentif' => 'decimal:2',
        'potongan_tidak_masuk' => 'decimal:2',
        'potongan_terlambat' => 'decimal:2',
        'potongan_lain' => 'decimal:2',
        'total_gaji' => 'decimal:2',
        'total_potongan' => 'decimal:2',
        'gaji_bersih' => 'decimal:2',
        'tanggal_pembayaran' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payroll) {
            $payroll->calculateTotals();
        });

        static::updating(function ($payroll) {
            $payroll->calculateTotals();
        });
    }

    public function calculateTotals()
    {
        // Parse tunjangan_lain JSON to get total perusahaan and karyawan
        $tunjanganData = json_decode($this->tunjangan_lain, true) ?? [];
        $totalTunjanganPerusahaan = 0;
        $totalPotonganKaryawan = 0;

        foreach ($tunjanganData as $tunjangan) {
            $totalTunjanganPerusahaan += $tunjangan['perusahaan'] ?? 0;
            $totalPotonganKaryawan += $tunjangan['karyawan'] ?? 0;
        }

        // total_gaji = gaji_pokok + tunjangan_jabatan + insentif + total_tunjangan_perusahaan
        $this->total_gaji = $this->gaji_pokok + $this->tunjangan_jabatan + ($this->insentif ?? 0) + $totalTunjanganPerusahaan;

        // total_potongan = potongan_tidak_masuk + potongan_terlambat + potongan_lain + total_potongan_karyawan
        $this->total_potongan = $this->potongan_tidak_masuk + $this->potongan_terlambat + ($this->potongan_lain ?? 0) + $totalPotonganKaryawan;

        // gaji_bersih = total_gaji - total_potongan
        $this->gaji_bersih = $this->total_gaji - $this->total_potongan;
    }
}
