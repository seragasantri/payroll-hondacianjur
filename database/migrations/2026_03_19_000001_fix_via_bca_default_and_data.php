<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ubah default via_bca menjadi false untuk employee baru
        Schema::table('employees', function (Blueprint $table) {
            $table->boolean('via_bca')->default(false)->change();
        });

        // Update employee yang tidak punya nomor rekening menjadi via_bca = false
        DB::table('employees')
            ->whereNull('nomor_rekening')
            ->orWhere('nomor_rekening', '')
            ->update(['via_bca' => false]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->boolean('via_bca')->default(true)->change();
        });
    }
};
