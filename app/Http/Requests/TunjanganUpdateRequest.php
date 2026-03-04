<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TunjanganUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'jenis_tunjangan' => 'sometimes|string|max:255|unique:tunjangans,jenis_tunjangan,' . $this->route('id'),
            'perusahaan' => 'sometimes|numeric|min:0|max:100',
            'karyawan' => 'sometimes|numeric|min:0|max:100',
            'total' => 'sometimes|numeric|min:0|max:100',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'jenis_tunjangan.unique' => 'Jenis Tunjangan sudah terdaftar',
            'perusahaan.numeric' => 'Persentase perusahaan harus berupa angka',
            'perusahaan.max' => 'Persentase perusahaan maksimal 100%',
            'karyawan.numeric' => 'Persentase karyawan harus berupa angka',
            'karyawan.max' => 'Persentase karyawan maksimal 100%',
            'total.numeric' => 'Total persentase harus berupa angka',
            'total.max' => 'Total persentase maksimal 100%',
        ];
    }
}
