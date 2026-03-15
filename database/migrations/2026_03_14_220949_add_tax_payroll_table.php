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
        Schema::table('payroll_details', function (Blueprint $table) {
            $table->decimal('pph21_amount', 15, 2)->default(0)->after('total_potongan');
            $table->string('tax_method')->nullable()->after('pph21_amount'); // TER atau Pasal 17
            $table->decimal('tax_rate_applied', 5, 2)->default(0)->after('tax_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_details', function (Blueprint $table) {
            $table->dropColumn(['pph21_amount', 'tax_method', 'tax_rate_applied']);
        });
    }
};
