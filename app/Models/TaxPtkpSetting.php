<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxPtkpSetting extends Model
{
    protected $fillable = ['ptkp_code', 'amount', 'ter_category'];
}
