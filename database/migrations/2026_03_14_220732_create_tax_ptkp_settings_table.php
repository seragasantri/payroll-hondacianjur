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
        Schema::create('tax_ptkp_settings', function (Blueprint $table) {
            $table->id();
            $table->string('ptkp_code', 10)->unique(); // TK/0, K/1, dll
            $table->decimal('amount', 15, 2);          // Nominal Rupiah (54jt, dll)
            $table->enum('ter_category', ['A', 'B', 'C']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_ptkp_settings');
    }
};
