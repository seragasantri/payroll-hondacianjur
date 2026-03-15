<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxTerRate extends Model
{
    protected $fillable = ['category', 'min_gross', 'max_gross', 'percentage'];
}
