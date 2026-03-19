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
            // Checklist KJT - jika dicentang, employee masuk ke laporan BPJS
            $table->boolean('bpjs_ketenagakerjaan')->default(false)->after('via_bca');

            // Checklist Tunjangan - 5 checkbox untuk menampilkan tunjangan di slip gaji
            $table->boolean('tunjangan_bpjs_kes')->default(false)->after('bpjs_ketenagakerjaan');
            $table->boolean('tunjangan_jht')->default(false)->after('tunjangan_bpjs_kes');
            $table->boolean('tunjangan_jkk')->default(false)->after('tunjangan_jht');
            $table->boolean('tunjangan_jkm')->default(false)->after('tunjangan_jkk');
            $table->boolean('tunjangan_pensiun')->default(false)->after('tunjangan_jkm');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'bpjs_ketenagakerjaan',
                'tunjangan_bpjs_kes',
                'tunjangan_jht',
                'tunjangan_jkk',
                'tunjangan_jkm',
                'tunjangan_pensiun',
            ]);
        });
    }
};
