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
        // Create new payrolls table (header)
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->string('bulan'); // Format: YYYY-MM
            $table->string('status_pegawai'); // Pegawai Tetap / Pegawai Kontrak
            $table->enum('status', ['draft', 'published', 'paid'])->default('draft');
            $table->date('tanggal_pembayaran')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['bulan', 'status_pegawai']);
        });

        // Create payroll_details table
        Schema::create('payroll_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_id')->constrained('payrolls')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->integer('hari_kerja')->default(0);
            $table->integer('hari_masuk')->default(0);
            $table->integer('jam_terlambat')->default(0);
            $table->decimal('gaji_pokok', 15, 2)->default(0);
            $table->decimal('tunjangan_jabatan', 15, 2)->default(0);
            $table->text('tunjangan_lain')->nullable();
            $table->decimal('insentif', 15, 2)->default(0);
            $table->decimal('uang_hadir', 15, 2)->default(0);
            $table->decimal('lembur', 15, 2)->default(0);
            $table->decimal('reward', 15, 2)->default(0);
            $table->decimal('lain_lain', 15, 2)->default(0);
            $table->decimal('potongan_tidak_masuk', 15, 2)->default(0);
            $table->decimal('potongan_terlambat', 15, 2)->default(0);
            $table->decimal('potongan_lain', 15, 2)->default(0);
            $table->decimal('total_gaji', 15, 2)->default(0);
            $table->decimal('total_potongan', 15, 2)->default(0);
            $table->decimal('gaji_bersih', 15, 2)->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['payroll_id', 'employee_id']);
        });

        // Migrate existing data from payroll to payrolls and payroll_details
        $this->migrateExistingData();
    }

    /**
     * Migrate existing data from old payroll table
     */
    private function migrateExistingData(): void
    {
        // Check if old payroll table exists and has data
        if (!Schema::hasTable('payroll')) {
            return;
        }

        $oldPayrolls = DB::table('payroll')
            ->select('bulan', 'status', 'tanggal_pembayaran', 'created_by', 'updated_by', 'created_at', 'updated_at')
            ->distinct()
            ->get();

        foreach ($oldPayrolls as $old) {
            // Insert into payrolls
            $payrollId = DB::table('payrolls')->insertGetId([
                'bulan' => $old->bulan,
                'status_pegawai' => 'Pegawai Tetap', // Default since old table didn't have this
                'status' => $old->status,
                'tanggal_pembayaran' => $old->tanggal_pembayaran,
                'created_by' => $old->created_by,
                'updated_by' => $old->updated_by,
                'created_at' => $old->created_at,
                'updated_at' => $old->updated_at,
            ]);

            // Get all payroll records for this bulan
            $payrollRecords = DB::table('payroll')
                ->where('bulan', $old->bulan)
                ->get();

            foreach ($payrollRecords as $record) {
                DB::table('payroll_details')->insert([
                    'payroll_id' => $payrollId,
                    'employee_id' => $record->employee_id,
                    'hari_kerja' => $record->hari_kerja,
                    'hari_masuk' => $record->hari_masuk,
                    'jam_terlambat' => $record->jam_terlambat,
                    'gaji_pokok' => $record->gaji_pokok,
                    'tunjangan_jabatan' => $record->tunjangan_jabatan,
                    'tunjangan_lain' => $record->tunjangan_lain,
                    'insentif' => $record->insentif ?? 0,
                    'uang_hadir' => $record->uang_hadir ?? 0,
                    'lembur' => $record->lembur ?? 0,
                    'reward' => $record->reward ?? 0,
                    'lain_lain' => $record->lain_lain ?? 0,
                    'potongan_tidak_masuk' => $record->potongan_tidak_masuk,
                    'potongan_terlambat' => $record->potongan_terlambat,
                    'potongan_lain' => $record->potongan_lain,
                    'total_gaji' => $record->total_gaji,
                    'total_potongan' => $record->total_potongan,
                    'gaji_bersih' => $record->gaji_bersih,
                    'created_by' => $record->created_by,
                    'updated_by' => $record->updated_by,
                    'created_at' => $record->created_at,
                    'updated_at' => $record->updated_at,
                ]);
            }
        }

        // Drop old payroll table
        Schema::dropIfExists('payroll');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore old payroll table
        Schema::create('payroll', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->string('bulan'); // Format: YYYY-MM
            $table->string('status_filter')->nullable();
            $table->integer('hari_kerja')->default(0);
            $table->integer('hari_masuk')->default(0);
            $table->integer('jam_terlambat')->default(0);
            $table->decimal('gaji_pokok', 15, 2)->default(0);
            $table->decimal('tunjangan_jabatan', 15, 2)->default(0);
            $table->text('tunjangan_lain')->nullable();
            $table->decimal('insentif', 15, 2)->default(0);
            $table->decimal('uang_hadir', 15, 2)->default(0);
            $table->decimal('lembur', 15, 2)->default(0);
            $table->decimal('reward', 15, 2)->default(0);
            $table->decimal('lain_lain', 15, 2)->default(0);
            $table->decimal('potongan_tidak_masuk', 15, 2)->default(0);
            $table->decimal('potongan_terlambat', 15, 2)->default(0);
            $table->decimal('potongan_lain', 15, 2)->default(0);
            $table->decimal('total_gaji', 15, 2)->default(0);
            $table->decimal('total_potongan', 15, 2)->default(0);
            $table->decimal('gaji_bersih', 15, 2)->default(0);
            $table->enum('status', ['draft', 'published', 'paid'])->default('draft');
            $table->date('tanggal_pembayaran')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['employee_id', 'bulan']);
        });

        // Migrate data back from payrolls and payroll_details
        $payrolls = DB::table('payrolls')->get();

        foreach ($payrolls as $payroll) {
            $details = DB::table('payroll_details')
                ->where('payroll_id', $payroll->id)
                ->get();

            foreach ($details as $detail) {
                DB::table('payroll')->insert([
                    'employee_id' => $detail->employee_id,
                    'bulan' => $payroll->bulan,
                    'status_filter' => $payroll->status_pegawai,
                    'hari_kerja' => $detail->hari_kerja,
                    'hari_masuk' => $detail->hari_masuk,
                    'jam_terlambat' => $detail->jam_terlambat,
                    'gaji_pokok' => $detail->gaji_pokok,
                    'tunjangan_jabatan' => $detail->tunjangan_jabatan,
                    'tunjangan_lain' => $detail->tunjangan_lain,
                    'insentif' => $detail->insentif,
                    'uang_hadir' => $detail->uang_hadir,
                    'lembur' => $detail->lembur,
                    'reward' => $detail->reward,
                    'lain_lain' => $detail->lain_lain,
                    'potongan_tidak_masuk' => $detail->potongan_tidak_masuk,
                    'potongan_terlambat' => $detail->potongan_terlambat,
                    'potongan_lain' => $detail->potongan_lain,
                    'total_gaji' => $detail->total_gaji,
                    'total_potongan' => $detail->total_potongan,
                    'gaji_bersih' => $detail->gaji_bersih,
                    'status' => $payroll->status,
                    'tanggal_pembayaran' => $payroll->tanggal_pembayaran,
                    'created_by' => $detail->created_by,
                    'updated_by' => $detail->updated_by,
                    'created_at' => $detail->created_at,
                    'updated_at' => $detail->updated_at,
                ]);
            }
        }

        Schema::dropIfExists('payroll_details');
        Schema::dropIfExists('payrolls');
    }
};
