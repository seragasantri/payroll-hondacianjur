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
        Schema::create('tax_ter_rates', function (Blueprint $table) {
            $table->id();
            $table->enum('category', ['A', 'B', 'C']);
            $table->decimal('min_gross', 15, 2);
            $table->decimal('max_gross', 15, 2)->nullable();
            $table->decimal('percentage', 5, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_ter_rates');
    }
};
