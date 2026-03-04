<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tunjangan extends Model
{
    protected $fillable = [
        'jenis_tunjangan',
        'perusahaan',
        'karyawan',
        'total',
    ];

    protected $casts = [
        'perusahaan' => 'decimal:2',
        'karyawan' => 'decimal:2',
        'total' => 'decimal:2',
    ];
}
