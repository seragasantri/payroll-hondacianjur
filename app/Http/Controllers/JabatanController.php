<?php

namespace App\Http\Controllers;

use App\Http\Requests\JabatanStoreRequest;
use App\Http\Requests\JabatanUpdateRequest;
use App\Services\JabatanServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class JabatanController extends Controller
{
    protected $jabatanServices;

    public function __construct()
    {
        $this->jabatanServices = new \App\Services\JabatanServices();
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', \App\Models\Jabatan::class);

        $perPage = $request->get('perPage', 10);
        $searchName = $request->get('searchName');
        $sortField = $request->get('sortField', 'id');
        $sortDirection = $request->get('sortDirection', 'desc');

        $query = $this->jabatanServices->getAll();

        if ($searchName) {
            $query = $query->where('name', 'like', '%' . $searchName . '%');
        }

        $query = $query->orderBy($sortField, $sortDirection);

        $jabatan = $query->paginate($perPage);

        return Inertia::render('jabatan/index', [
            'jabatan' => $jabatan
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', \App\Models\Jabatan::class);

        return Inertia::render('jabatan/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(JabatanStoreRequest $request)
    {
        Gate::authorize('create', \App\Models\Jabatan::class);

        $this->jabatanServices->create($request->validated());

        return redirect()->route('jabatan.index')
            ->with('success', 'Jabatan berhasil ditambahkan!');
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
        $jabatan = $this->jabatanServices->findId($id);

        Gate::authorize('update', $jabatan);

        return Inertia::render('jabatan/edit', [
            'jabatan' => $jabatan
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(JabatanUpdateRequest $request, $id)
    {
        $jabatan = $this->jabatanServices->findId($id);

        Gate::authorize('update', $jabatan);

        $this->jabatanServices->update($id, $request->validated());

        return redirect()->route('jabatan.index')
            ->with('success', 'Jabatan berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $jabatan = $this->jabatanServices->findId($id);

        Gate::authorize('delete', $jabatan);

        $this->jabatanServices->delete($id);

        return to_route('jabatan.index');
    }
}
