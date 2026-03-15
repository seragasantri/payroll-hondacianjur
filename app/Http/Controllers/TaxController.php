<?php

namespace App\Http\Controllers;

use App\Services\TaxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class TaxController extends Controller
{
    protected $taxService;

    public function __construct()
    {
        $this->taxService = new TaxService();
    }

    /**
     * Display tax settings page
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', \App\Models\User::class);

        $tab = $request->get('tab', 'ptkp');

        // Always load all tax data
        $data = [
            'ptkp' => $this->taxService->getAllPtkp(),
            'ter' => $this->taxService->getAllTerRates(),
            'Pasal17' => $this->taxService->getAllPasal17Rates(),
        ];

        return Inertia::render('tax/index', array_merge($data, ['tab' => $tab]));
    }

    /**
     * Calculate tax preview
     */
    public function calculate(Request $request)
    {
        $gajiGross = (float) $request->get('gaji_gross', 0);
        $ptkpCode = $request->get('ptkp_code', 'TK/0');

        $hasilTER = $this->taxService->hitungTER($gajiGross, $ptkpCode);
        $hasilPasal17 = $this->taxService->hitungPasal17($gajiGross, $ptkpCode);

        return response()->json([
            'ter' => $hasilTER,
            'pasal17' => $hasilPasal17
        ]);
    }
}
