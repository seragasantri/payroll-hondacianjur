<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'nip',
        'nik',
        'jenis_kelamin',
        'nama',
        'kantor_cabang_id',
        'jabatan_id',
        'tanggal_mulai_kerja',
        'gaji_pokok',
        'tunjangan_jabatan',
        'potongan_tidak_masuk',
        'potongan_terlambat',
        'nomor_rekening',
        'kjt',
        'status_pegawai',
        'ptkp',
        'via_bca',
    ];

    protected $casts = [
        'tanggal_mulai_kerja' => 'date',
        'gaji_pokok' => 'decimal:2',
        'tunjangan_jabatan' => 'decimal:2',
        'potongan_tidak_masuk' => 'decimal:2',
        'potongan_terlambat' => 'decimal:2',
    ];

    /**
     * Get the user that owns the employee.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the Kantor Cab that belongs to the employee.
     */
    public function kantorCabang(): BelongsTo
    {
        return $this->belongsTo(KantorCabang::class, 'kantor_cabang_id');
    }

    /**
     * Get the jabatan that belongs to the employee.
     */
    public function jabatan(): BelongsTo
    {
        return $this->belongsTo(Jabatan::class);
    }

    /**
     * Get total gaji (gaji pokok + tunjangan).
     */
    public function getTotalGajiAttribute(): float
    {
        return (float) $this->gaji_pokok + (float) $this->tunjangan_jabatan;
    }

    /**
     * Get total potongan.
     */
    public function getTotalPotonganAttribute(): float
    {
        return (float) $this->potongan_tidak_masuk + (float) $this->potongan_terlambat;
    }

    /**
     * Get gaji bersih (total gaji - total potongan).
     */
    public function getGajiBersihAttribute(): float
    {
        return $this->getTotalGajiAttribute() - $this->getTotalPotonganAttribute();
    }
}
