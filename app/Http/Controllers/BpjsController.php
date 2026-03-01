<?php

namespace App\Http\Controllers;

use App\Http\Requests\BpjsStoreRequest;
use App\Http\Requests\BpjsUpdateRequest;
use App\Http\Resources\BpjsResource;
use App\Services\BpjsServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class BpjsController extends Controller
{
    protected $bpjsServices;

    public function __construct()
    {
        $this->bpjsServices = new \App\Services\BpjsServices();
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Check authorization
        Gate::authorize('viewAny', \App\Models\Bpjs::class);

        $perPage = $request->get('perPage', 10);
        $searchJenis = $request->get('searchJenis');
        $sortField = $request->get('sortField', 'jenis_bpjs');
        $sortDirection = $request->get('sortDirection', 'asc');

        $query = $this->bpjsServices->getAll();

        // Search filter
        if ($searchJenis) {
            $query = $query->where('jenis_bpjs', 'like', '%' . $searchJenis . '%');
        }

        // Sorting
        $query = $query->orderBy($sortField, $sortDirection);

        $bpjs = $query->paginate($perPage);

        return Inertia::render('bpjs/index', [
            'bpjs' => BpjsResource::collection($bpjs)
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Check authorization
        Gate::authorize('create', \App\Models\Bpjs::class);

        return Inertia::render('bpjs/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(BpjsStoreRequest $request)
    {
        // Check authorization
        Gate::authorize('create', \App\Models\Bpjs::class);

        $this->bpjsServices->create($request->validated());

        return redirect()->route('bpjs.index')
            ->with('success', 'BPJS berhasil ditambahkan!');
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
        $bpjs = $this->bpjsServices->findId($id);

        // Check authorization
        Gate::authorize('update', $bpjs);

        return Inertia::render('bpjs/edit', [
            'bpjs' => new BpjsResource($bpjs)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(BpjsUpdateRequest $request, $id)
    {
        $bpjs = $this->bpjsServices->findId($id);

        // Check authorization
        Gate::authorize('update', $bpjs);

        $this->bpjsServices->update($id, $request->validated());

        return redirect()->route('bpjs.index')
            ->with('success', 'BPJS berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $bpjs = $this->bpjsServices->findId($id);

        // Check authorization
        Gate::authorize('delete', $bpjs);

        $this->bpjsServices->delete($id);

        return to_route('bpjs.index');
    }
}
