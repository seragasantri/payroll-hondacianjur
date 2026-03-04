<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Employee extends Model
{
    protected $fillable = [
        'user_id',
        'nip',
        'nama',
        'divisi_id',
        'jabatan_id',
        'tanggal_mulai_kerja',
        'gaji_pokok',
        'tunjangan_jabatan',
        'potongan_tidak_masuk',
        'potongan_terlambat',
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
     * Get the divisi that belongs to the employee.
     */
    public function divisi(): BelongsTo
    {
        return $this->belongsTo(Divisi::class);
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
