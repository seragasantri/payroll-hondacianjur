<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayrollResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'bulan' => $this->bulan,
            'hari_kerja' => $this->hari_kerja,
            'hari_masuk' => $this->hari_masuk,
            'jam_terlambat' => $this->jam_terlambat,
            'gaji_pokok' => (float) $this->gaji_pokok,
            'tunjangan_jabatan' => (float) $this->tunjangan_jabatan,
            'tunjangan_lain' => (float) $this->tunjangan_lain,
            'potongan_tidak_masuk' => (float) $this->potongan_tidak_masuk,
            'potongan_terlambat' => (float) $this->potongan_terlambat,
            'potongan_lain' => (float) $this->potongan_lain,
            'total_gaji' => (float) $this->total_gaji,
            'total_potongan' => (float) $this->total_potongan,
            'gaji_bersih' => (float) $this->gaji_bersih,
            'status' => $this->status,
            'tanggal_pembayaran' => $this->tanggal_pembayaran,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Include employee data
            'employee' => $this->whenLoaded('employee', fn() => [
                'id' => $this->employee->id,
                'nip' => $this->employee->nip,
                'nama' => $this->employee->nama,
                'kantorCabang' => $this->whenLoaded('employee', fn() => $this->employee->kantorCabang ? [
                    'id' => $this->employee->kantorCabang->id,
                    'name' => $this->employee->kantorCabang->name,
                ] : null),
                'jabatan' => $this->whenLoaded('employee', fn() => $this->employee->jabatan ? [
                    'id' => $this->employee->jabatan->id,
                    'name' => $this->employee->jabatan->name,
                ] : null),
            ]),
        ];
    }
}
