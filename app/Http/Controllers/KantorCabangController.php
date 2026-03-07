<?php

namespace App\Http\Controllers;

use App\Http\Requests\KantorCabangStoreRequest;
use App\Http\Requests\KantorCabangUpdateRequest;
use App\Services\KantorCabangServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class KantorCabangController extends Controller
{
    protected $kantorCabangServices;

    public function __construct()
    {
        $this->kantorCabangServices = new \App\Services\KantorCabangServices();
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', \App\Models\KantorCabang::class);

        $perPage = $request->get('perPage', 10);
        $searchName = $request->get('searchName');
        $sortField = $request->get('sortField', 'id');
        $sortDirection = $request->get('sortDirection', 'desc');

        $query = $this->kantorCabangServices->getAll();

        if ($searchName) {
            $query = $query->where('name', 'like', '%' . $searchName . '%');
        }

        $query = $query->orderBy($sortField, $sortDirection);

        $kantorCabang = $query->paginate($perPage);

        return Inertia::render('kantor-cabang/index', [
            'kantorCabang' => $kantorCabang
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', \App\Models\KantorCabang::class);

        return Inertia::render('kantor-cabang/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(KantorCabangStoreRequest $request)
    {
        Gate::authorize('create', \App\Models\KantorCabang::class);

        $this->kantorCabangServices->create($request->validated());

        return redirect()->route('kantor-cabang.index')
            ->with('success', 'Kantor Cab berhasil ditambahkan!');
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
        $kantorCabang = $this->kantorCabangServices->findId($id);

        Gate::authorize('update', $kantorCabang);

        return Inertia::render('kantor-cabang/edit', [
            'kantorCabang' => $kantorCabang
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(KantorCabangUpdateRequest $request, $id)
    {
        $kantorCabang = $this->kantorCabangServices->findId($id);

        Gate::authorize('update', $kantorCabang);

        $this->kantorCabangServices->update($id, $request->validated());

        return redirect()->route('kantor-cabang.index')
            ->with('success', 'Kantor Cab berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $kantorCabang = $this->kantorCabangServices->findId($id);

        Gate::authorize('delete', $kantorCabang);

        $this->kantorCabangServices->delete($id);

        return to_route('kantor-cabang.index');
    }
}
