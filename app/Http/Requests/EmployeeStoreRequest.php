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
            'nik' => 'nullable|string|max:20',
            'jenis_kelamin' => 'nullable|string|in:laki-laki,perempuan',
            'nama' => 'required|string|max:255',
            'password' => 'nullable|string|min:6|confirmed',
            'kantor_cabang_id' => 'required|exists:kantor_cabangs,id',
            'jabatan_id' => 'required|exists:jabatans,id',
            'nomor_rekening' => 'nullable|string|max:255',
            'status_pegawai' => 'nullable|string|in:Pegawai Tetap,Pegawai Kontrak',
            'tanggal_mulai_kerja' => 'required|date',
            'ptkp' => 'nullable|string|in:TK/0,TK/1,TK/2,TK/3,K/0,K/1,K/2,K/3',
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
            'password.min' => 'Password minimal 6 karakter',
            'password.confirmed' => 'Konfirmasi password tidak cocok',
            'kantor_cabang_id.required' => 'Kantor Cab wajib diisi',
            'kantor_cabang_id.exists' => 'Kantor Cab tidak valid',
            'jabatan_id.required' => 'Jabatan wajib diisi',
            'jabatan_id.exists' => 'Jabatan tidak valid',
            'tanggal_mulai_kerja.required' => 'Tanggal mulai kerja wajib diisi',
            'gaji_pokok.required' => 'Gaji pokok wajib diisi',
            'gaji_pokok.numeric' => 'Gaji pokok harus berupa angka',
            'tunjangan_jabatan.required' => 'Tunjangan jabatan wajib diisi',
            'tunjangan_jabatan.numeric' => 'Tunjangan jabatan harus berupa angka',
        ];
    }
}
