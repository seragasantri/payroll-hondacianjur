<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bpjs extends Model
{
    protected $fillable = [
        'jenis_bpjs',
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
