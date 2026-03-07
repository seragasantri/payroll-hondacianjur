<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payrolls extends Model
{
    use HasFactory;

    protected $table = 'payrolls';

    protected $fillable = [
        'bulan',
        'status_pegawai',
        'status',
        'tanggal_pembayaran',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'tanggal_pembayaran' => 'date',
    ];

    public function details(): HasMany
    {
        return $this->hasMany(PayrollDetail::class, 'payroll_id');
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

    public function getTotalKaryawanAttribute(): int
    {
        return $this->details()->count();
    }

    public function getTotalGajiBersihAttribute(): float
    {
        return $this->details()->sum('gaji_bersih');
    }
}
