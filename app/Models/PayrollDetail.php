<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollDetail extends Model
{
    use HasFactory;

    protected $table = 'payroll_details';

    protected $fillable = [
        'payroll_id',
        'employee_id',
        'hari_kerja',
        'hari_masuk',
        'jam_terlambat',
        'gaji_pokok',
        'tunjangan_jabatan',
        'tunjangan_lain',
        'insentif',
        'uang_hadir',
        'lembur',
        'reward',
        'lain_lain',
        'kasbon',
        'potongan_tidak_masuk',
        'potongan_terlambat',
        'potongan_lain',
        'total_gaji',
        'total_potongan',
        'gaji_bersih',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'gaji_pokok' => 'decimal:2',
        'tunjangan_jabatan' => 'decimal:2',
        'insentif' => 'decimal:2',
        'uang_hadir' => 'decimal:2',
        'lembur' => 'decimal:2',
        'reward' => 'decimal:2',
        'lain_lain' => 'decimal:2',
        'kasbon' => 'decimal:2',
        'potongan_tidak_masuk' => 'decimal:2',
        'potongan_terlambat' => 'decimal:2',
        'potongan_lain' => 'decimal:2',
        'total_gaji' => 'decimal:2',
        'total_potongan' => 'decimal:2',
        'gaji_bersih' => 'decimal:2',
    ];

    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payrolls::class, 'payroll_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payrollDetail) {
            $payrollDetail->calculateTotals();
        });

        static::updating(function ($payrollDetail) {
            $payrollDetail->calculateTotals();
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

        // total_gaji = gaji_pokok + tunjangan_jabatan + insentif + uang_hadir + lembur + reward + lain_lain + total_tunjangan_perusahaan
        $this->total_gaji = $this->gaji_pokok
            + $this->tunjangan_jabatan
            + ($this->insentif ?? 0)
            + ($this->uang_hadir ?? 0)
            + ($this->lembur ?? 0)
            + ($this->reward ?? 0)
            + ($this->lain_lain ?? 0)
            + $totalTunjanganPerusahaan;

        // total_potongan = kasbon + potongan_tidak_masuk + potongan_terlambat + potongan_lain + total_tunjangan_perusahaan + total_potongan_karyawan
        $this->total_potongan = ($this->kasbon ?? 0)
            + $this->potongan_tidak_masuk
            + $this->potongan_terlambat
            + ($this->potongan_lain ?? 0)
            + $totalTunjanganPerusahaan
            + $totalPotonganKaryawan;

        // gaji_bersih = total_gaji - total_potongan
        $this->gaji_bersih = $this->total_gaji - $this->total_potongan;
    }
}
