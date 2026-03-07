<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KantorCabang extends Model
{
    protected $table = 'kantor_cabangs';

    protected $fillable = [
        'name'
    ];

    /**
     * Get the employees that belong to this kantor cabang.
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
