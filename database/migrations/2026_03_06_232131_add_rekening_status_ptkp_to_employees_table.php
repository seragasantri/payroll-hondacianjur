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
        Schema::table('employees', function (Blueprint $table) {
            $table->string('nomor_rekening')->nullable()->after('potongan_terlambat');
            $table->string('status_pegawai')->nullable()->after('nomor_rekening');
            $table->string('ptkp')->nullable()->after('status_pegawai');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['nomor_rekening', 'status_pegawai', 'ptkp']);
        });
    }
};
