<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmployeeStoreRequest;
use App\Http\Requests\EmployeeUpdateRequest;
use App\Http\Resources\EmployeeResource;
use App\Services\KantorCabangServices;
use App\Services\EmployeeServices;
use App\Services\JabatanServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    protected $employeeServices;
    protected $kantorCabangServices;
    protected $jabatanServices;

    public function __construct()
    {
        $this->employeeServices = new EmployeeServices;
        $this->kantorCabangServices = new KantorCabangServices;
        $this->jabatanServices = new JabatanServices;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Check authorization
        Gate::authorize('viewAny', \App\Models\Employee::class);

        $perPage = $request->get('perPage', 10);
        $searchNama = $request->input('searchNama');
        $searchNIP = $request->input('searchNIP');
        $searchKantorCabang = $request->input('searchKantorCabang');
        $searchJabatan = $request->input('searchJabatan');
        $sortField = $request->input('sortField', 'nama');
        $sortDirection = $request->input('sortDirection', 'asc');

        $query = $this->employeeServices->getAll();

        // Filter by nama
        if ($searchNama) {
            $query->where('nama', 'like', "%{$searchNama}%");
        }

        // Filter by NIP
        if ($searchNIP) {
            $query->where('nip', 'like', "%{$searchNIP}%");
        }

        // Filter by kantorCabang
        if ($searchKantorCabang) {
            $query->whereHas('kantorCabang', function ($q) use ($searchKantorCabang) {
                $q->where('name', 'like', "%{$searchKantorCabang}%");
            });
        }

        // Filter by jabatan
        if ($searchJabatan) {
            $query->whereHas('jabatan', function ($q) use ($searchJabatan) {
                $q->where('name', 'like', "%{$searchJabatan}%");
            });
        }

        // Sorting
        $query->orderBy($sortField, $sortDirection);

        $employees = $query->paginate($perPage);

        return Inertia::render('employees/index', [
            'employees' => EmployeeResource::collection($employees),
            'kantorCabang' => $this->kantorCabangServices->getAll()->orderBy('name', 'asc')->get(),
            'jabatan' => $this->jabatanServices->getAll()->orderBy('name', 'asc')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Check authorization
        Gate::authorize('create', \App\Models\Employee::class);

        $kantorCabang = $this->kantorCabangServices->getAll()->orderBy('name', 'asc')->get();
        $jabatan = $this->jabatanServices->getAll()->orderBy('name', 'asc')->get();

        return Inertia::render('employees/create', [
            'kantorCabang' => $kantorCabang,
            'jabatan' => $jabatan,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(EmployeeStoreRequest $request)
    {
        // Check authorization
        Gate::authorize('create', \App\Models\Employee::class);

        $this->employeeServices->create($request->validated());

        return redirect()->route('employees.index')
            ->with('success', 'Karyawan berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $employee = $this->employeeServices->findId($id);

        // Check authorization
        Gate::authorize('update', $employee);

        $kantorCabang = $this->kantorCabangServices->getAll()->orderBy('name', 'asc')->get();
        $jabatan = $this->jabatanServices->getAll()->orderBy('name', 'asc')->get();

        return Inertia::render('employees/edit', [
            'employee' => new EmployeeResource($employee->load('kantorCabang', 'jabatan')),
            'kantorCabang' => $kantorCabang,
            'jabatan' => $jabatan,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(EmployeeUpdateRequest $request, $id)
    {
        $employee = $this->employeeServices->findId($id);

        // Check authorization
        Gate::authorize('update', $employee);

        $this->employeeServices->update($id, $request->validated());

        return redirect()->route('employees.index')
            ->with('success', 'Karyawan berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $employee = $this->employeeServices->findId($id);

        // Check authorization
        Gate::authorize('delete', $employee);

        $this->employeeServices->delete($id);

        return to_route('employees.index');
    }
}
