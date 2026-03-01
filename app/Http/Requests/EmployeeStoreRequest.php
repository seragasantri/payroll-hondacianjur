<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EmployeeStoreRequest extends FormRequest
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
            'nip' => 'required|string|unique:employees,nip|unique:users,username',
            'nama' => 'required|string|max:255',
            'password' => 'required|string|min:8|confirmed',
            'divisi' => 'required|string|max:255',
            'jabatan' => 'required|string|max:255',
            'tanggal_mulai_kerja' => 'required|date',
            'gaji_pokok' => 'required|numeric|min:0',
            'tunjangan_jabatan' => 'required|numeric|min:0',
            'potongan_tidak_masuk' => 'required|numeric|min:0',
            'potongan_terlambat' => 'required|numeric|min:0',
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
            'nip.required' => 'NIP wajib diisi',
            'nip.unique' => 'NIP sudah terdaftar',
            'nama.required' => 'Nama wajib diisi',
            'password.required' => 'Password wajib diisi',
            'password.min' => 'Password minimal 8 karakter',
            'password.confirmed' => 'Konfirmasi password tidak cocok',
            'divisi.required' => 'Divisi wajib diisi',
            'jabatan.required' => 'Jabatan wajib diisi',
            'tanggal_mulai_kerja.required' => 'Tanggal mulai kerja wajib diisi',
            'gaji_pokok.required' => 'Gaji pokok wajib diisi',
            'gaji_pokok.numeric' => 'Gaji pokok harus berupa angka',
            'tunjangan_jabatan.required' => 'Tunjangan jabatan wajib diisi',
            'tunjangan_jabatan.numeric' => 'Tunjangan jabatan harus berupa angka',
        ];
    }
}
