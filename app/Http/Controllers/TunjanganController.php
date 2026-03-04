<?php

namespace App\Http\Controllers;

use App\Http\Requests\TunjanganStoreRequest;
use App\Http\Requests\TunjanganUpdateRequest;
use App\Http\Resources\TunjanganResource;
use App\Services\TunjanganServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class TunjanganController extends Controller
{
    protected $tunjanganServices;

    public function __construct()
    {
        $this->tunjanganServices = new \App\Services\TunjanganServices();
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Check authorization
        Gate::authorize('viewAny', \App\Models\Tunjangan::class);

        $perPage = $request->get('perPage', 10);
        $searchJenis = $request->get('searchJenis');
        $sortField = $request->get('sortField', 'jenis_tunjangan');
        $sortDirection = $request->get('sortDirection', 'asc');

        $query = $this->tunjanganServices->getAll();

        // Search filter
        if ($searchJenis) {
            $query = $query->where('jenis_tunjangan', 'like', '%' . $searchJenis . '%');
        }

        // Sorting
        $query = $query->orderBy($sortField, $sortDirection);

        $tunjangan = $query->paginate($perPage);

        return Inertia::render('tunjangan/index', [
            'tunjangan' => TunjanganResource::collection($tunjangan)
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Check authorization
        Gate::authorize('create', \App\Models\Tunjangan::class);

        return Inertia::render('tunjangan/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TunjanganStoreRequest $request)
    {
        // Check authorization
        Gate::authorize('create', \App\Models\Tunjangan::class);

        $this->tunjanganServices->create($request->validated());

        return redirect()->route('tunjangan.index')
            ->with('success', 'Tunjangan berhasil ditambahkan!');
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
        $tunjangan = $this->tunjanganServices->findId($id);

        // Check authorization
        Gate::authorize('update', $tunjangan);

        return Inertia::render('tunjangan/edit', [
            'tunjangan' => new TunjanganResource($tunjangan)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TunjanganUpdateRequest $request, $id)
    {
        $tunjangan = $this->tunjanganServices->findId($id);

        // Check authorization
        Gate::authorize('update', $tunjangan);

        $this->tunjanganServices->update($id, $request->validated());

        return redirect()->route('tunjangan.index')
            ->with('success', 'Tunjangan berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $tunjangan = $this->tunjanganServices->findId($id);

        // Check authorization
        Gate::authorize('delete', $tunjangan);

        $this->tunjanganServices->delete($id);

        return to_route('tunjangan.index');
    }
}
