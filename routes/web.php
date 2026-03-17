<?php

use App\Http\Controllers\KantorCabangController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\JabatanController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TunjanganController;
use App\Http\Controllers\TaxController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LaporanController;
use Illuminate\Support\Facades\Route;


Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('users', UserController::class);
    Route::resource('employees', EmployeeController::class);
    Route::get('employees/export/excel', [EmployeeController::class, 'exportExcel'])->name('employees.export.excel');
    Route::get('employees/export/pdf', [EmployeeController::class, 'exportPdf'])->name('employees.export.pdf');

    // Retired employees routes
    Route::get('employees/list/retired', [EmployeeController::class, 'retiredIndex'])->name('employees.retired.index');
    Route::post('employees/{id}/restore', [EmployeeController::class, 'restore'])->name('employees.restore');
    Route::delete('employees/{id}/permanent', [EmployeeController::class, 'permanentDelete'])->name('employees.permanent-delete');

    Route::resource('kantor-cabang', KantorCabangController::class);
    Route::resource('jabatan', JabatanController::class);
    Route::resource('tunjangan', TunjanganController::class)->except(['create', 'delete']);

    // Tax settings routes
    Route::get('tax', [TaxController::class, 'index'])->name('tax.index');
    Route::post('tax/calculate', [TaxController::class, 'calculate'])->name('tax.calculate');

    // Payroll routes - using bulan instead of id
    Route::get('payroll', [PayrollController::class, 'index'])->name('payroll.index');
    Route::get('payroll/create', [PayrollController::class, 'create'])->name('payroll.create');
    Route::post('payroll', [PayrollController::class, 'store'])->name('payroll.store');
    Route::get('payroll/{bulan}/detail', [PayrollController::class, 'show'])->name('payroll.show');
    Route::get('payroll/{bulan}/export', [PayrollController::class, 'export'])->name('payroll.export');
    Route::get('payroll/{bulan}/export-detail', [PayrollController::class, 'exportDetail'])->name('payroll.export-detail');
    Route::get('payroll/{bulan}/edit', [PayrollController::class, 'edit'])->name('payroll.edit');
    Route::put('payroll/{bulan}', [PayrollController::class, 'update'])->name('payroll.update');
    Route::delete('payroll/{bulan}', [PayrollController::class, 'destroy'])->name('payroll.destroy');
    Route::post('payroll/publish', [PayrollController::class, 'publish'])->name('payroll.publish');
    Route::get('payroll/check', [PayrollController::class, 'check'])->name('payroll.check');

    // Laporan routes
    Route::get('laporan', [LaporanController::class, 'index'])->name('laporan.index');
    Route::get('laporan/{cabangId}/{tahun}/export-bpjs-kes', [LaporanController::class, 'exportBpjsKes'])->name('laporan.export-bpjs-kes');
    Route::get('laporan/{cabangId}/{tahun}/export-bpjs-tk', [LaporanController::class, 'exportBpjsTk'])->name('laporan.export-bpjs-tk');

    Route::resource('roles', RoleController::class);
    Route::resource('permissions', PermissionController::class);
});

require __DIR__ . '/settings.php';
