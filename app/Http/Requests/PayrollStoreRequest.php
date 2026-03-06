<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PayrollStoreRequest extends FormRequest
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
            'employee_id' => 'required|exists:employees,id',
            'bulan' => 'required|date_format:Y-m|unique:payroll,bulan,NULL,id,employee_id,' . $this->employee_id,
            'hari_kerja' => 'required|integer|min:0',
            'hari_masuk' => 'required|integer|min:0',
            'jam_terlambat' => 'required|integer|min:0',
            'gaji_pokok' => 'required|numeric|min:0',
            'tunjangan_jabatan' => 'required|numeric|min:0',
            'tunjangan_lain' => 'nullable|numeric|min:0',
            'potongan_tidak_masuk' => 'required|numeric|min:0',
            'potongan_terlambat' => 'required|numeric|min:0',
            'potongan_lain' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,published,paid',
        ];
    }

    public function messages(): array
    {
        return [
            'bulan.unique' => 'Data payroll untuk karyawan ini pada bulan tersebut sudah ada.',
        ];
    }
}
