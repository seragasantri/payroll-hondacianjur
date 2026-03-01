<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
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
            'user_id' => $this->user_id,
            'nip' => $this->nip,
            'nama' => $this->nama,
            'divisi' => $this->divisi,
            'jabatan' => $this->jabatan,
            'tanggal_mulai_kerja' => $this->tanggal_mulai_kerja,
            'gaji_pokok' => (float) $this->gaji_pokok,
            'tunjangan_jabatan' => (float) $this->tunjangan_jabatan,
            'potongan_tidak_masuk' => (float) $this->potongan_tidak_masuk,
            'potongan_terlambat' => (float) $this->potongan_terlambat,
            'total_gaji' => $this->getTotalGajiAttribute(),
            'total_potongan' => $this->getTotalPotonganAttribute(),
            'gaji_bersih' => $this->getGajiBersihAttribute(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Include user data
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'username' => $this->user->username,
                'email' => $this->user->email,
            ]),
        ];
    }
}
