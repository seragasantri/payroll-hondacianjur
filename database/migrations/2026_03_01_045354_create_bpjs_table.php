<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bpjs', function (Blueprint $table) {
            $table->id();
            $table->string('jenis_bpjs');
            $table->decimal('perusahaan', 5, 2)->default(0);
            $table->decimal('karyawan', 5, 2)->default(0);
            $table->decimal('total', 5, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bpjs');
    }
};
