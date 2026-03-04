<?php

namespace App\Http\Controllers;

use App\Http\Requests\DivisiStoreRequest;
use App\Http\Requests\DivisiUpdateRequest;
use App\Services\DivisiServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class DivisiController extends Controller
{
    protected $divisiServices;

    public function __construct()
    {
        $this->divisiServices = new \App\Services\DivisiServices();
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', \App\Models\Divisi::class);

        $perPage = $request->get('perPage', 10);
        $searchName = $request->get('searchName');
        $sortField = $request->get('sortField', 'id');
        $sortDirection = $request->get('sortDirection', 'desc');

        $query = $this->divisiServices->getAll();

        if ($searchName) {
            $query = $query->where('name', 'like', '%' . $searchName . '%');
        }

        $query = $query->orderBy($sortField, $sortDirection);

        $divisi = $query->paginate($perPage);

        return Inertia::render('divisi/index', [
            'divisi' => $divisi
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', \App\Models\Divisi::class);

        return Inertia::render('divisi/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DivisiStoreRequest $request)
    {
        Gate::authorize('create', \App\Models\Divisi::class);

        $this->divisiServices->create($request->validated());

        return redirect()->route('divisi.index')
            ->with('success', 'Divisi berhasil ditambahkan!');
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
        $divisi = $this->divisiServices->findId($id);

        Gate::authorize('update', $divisi);

        return Inertia::render('divisi/edit', [
            'divisi' => $divisi
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(DivisiUpdateRequest $request, $id)
    {
        $divisi = $this->divisiServices->findId($id);

        Gate::authorize('update', $divisi);

        $this->divisiServices->update($id, $request->validated());

        return redirect()->route('divisi.index')
            ->with('success', 'Divisi berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $divisi = $this->divisiServices->findId($id);

        Gate::authorize('delete', $divisi);

        $this->divisiServices->delete($id);

        return to_route('divisi.index');
    }
}
