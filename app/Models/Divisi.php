<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Divisi extends Model
{
    protected $fillable = [
        'name'
    ];

    /**
     * Get the employees that belong to this divisi.
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
