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
        Schema::table('payroll', function (Blueprint $table) {
            $table->decimal('uang_hadir', 15, 2)->default(0)->after('insentif');
            $table->decimal('lembur', 15, 2)->default(0)->after('uang_hadir');
            $table->decimal('reward', 15, 2)->default(0)->after('lembur');
            $table->decimal('lain_lain', 15, 2)->default(0)->after('reward');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll', function (Blueprint $table) {
            $table->dropColumn(['uang_hadir', 'lembur', 'reward', 'lain_lain']);
        });
    }
};
