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
        $viaBca = $this->input('via_bca') == '1' || $this->input('via_bca') === true;
        $bpjsKetenagakerjaan = $this->input('bpjs_ketenagakerjaan') == '1' || $this->input('bpjs_ketenagakerjaan') === true;

        return [
            'nip' => 'required|string|unique:employees,nip|unique:users,username',
            'nik' => 'required|string|max:20',
            'jenis_kelamin' => 'required|string|in:laki-laki,perempuan',
            'nama' => 'required|string|max:255',
            'password' => 'nullable|string|min:6|confirmed',
            'kantor_cabang_id' => 'required|exists:kantor_cabangs,id',
            'jabatan_id' => 'required|exists:jabatans,id',
            'nomor_rekening' => $viaBca ? 'required|string|max:255' : 'nullable|string|max:255',
            'kjt' => $bpjsKetenagakerjaan ? 'required|string|max:255' : 'nullable|string|max:255',
            'status_pegawai' => 'required|string|in:Pegawai Tetap,Pegawai Kontrak,magang',
            'tanggal_mulai_kerja' => 'required|date',
            'ptkp' => 'required|string|in:TK/0,TK/1,TK/2,TK/3,K/0,K/1,K/2,K/3',
            'gaji_pokok' => 'required|numeric|min:0',
            'tunjangan_jabatan' => 'required|numeric|min:0',
            'potongan_tidak_masuk' => 'required|numeric|min:0',
            'potongan_terlambat' => 'required|numeric|min:0',
            'via_bca' => 'nullable|boolean',
            'bpjs_ketenagakerjaan' => 'nullable|boolean',
            'tunjangan_bpjs_kes' => 'nullable|boolean',
            'tunjangan_jht' => 'nullable|boolean',
            'tunjangan_jkk' => 'nullable|boolean',
            'tunjangan_jkm' => 'nullable|boolean',
            'tunjangan_pensiun' => 'nullable|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $viaBca = $this->input('via_bca') == '1' || $this->input('via_bca') === true;
        $bpjsKetenagakerjaan = $this->input('bpjs_ketenagakerjaan') == '1' || $this->input('bpjs_ketenagakerjaan') === true;

        $messages = [
            'nip.required' => 'NIP wajib diisi',
            'nip.unique' => 'NIP sudah terdaftar',
            'nik.required' => 'NIK wajib diisi',
            'jenis_kelamin.required' => 'Jenis kelamin wajib diisi',
            'nama.required' => 'Nama wajib diisi',
            'password.required' => 'Password wajib diisi',
            'password.min' => 'Password minimal 6 karakter',
            'password.confirmed' => 'Konfirmasi password tidak cocok',
            'kantor_cabang_id.required' => 'Kantor Cab wajib diisi',
            'kantor_cabang_id.exists' => 'Kantor Cab tidak valid',
            'jabatan_id.required' => 'Jabatan wajib diisi',
            'jabatan_id.exists' => 'Jabatan tidak valid',
            'kjt.required' => 'KJT wajib diisi jika terdaftar BPJS Ketenagakerjaan',
            'status_pegawai.required' => 'Status pegwai wajib diisi',
            'tanggal_mulai_kerja.required' => 'Tanggal mulai kerja wajib diisi',
            'ptkp.required' => 'Status PTKP wajib diisi',
            'gaji_pokok.required' => 'Gaji pokok wajib diisi',
            'gaji_pokok.numeric' => 'Gaji pokok harus berupa angka',
            'tunjangan_jabatan.required' => 'Tunjangan jabatan wajib diisi',
            'tunjangan_jabatan.numeric' => 'Tunjangan jabatan harus berupa angka',
            'potongan_tidak_masuk.required' => 'Potongan tidak masuk wajib diisi',
            'potongan_terlambat.required' => 'Potongan terlambat wajib diisi',
        ];

        if ($viaBca) {
            $messages['nomor_rekening.required'] = 'Nomor rekening wajib diisi jika menerima gaji via BCA';
        }

        if ($bpjsKetenagakerjaan) {
            $messages['kjt.required'] = 'KJT wajib diisi jika terdaftar BPJS Ketenagakerjaan';
        }

        return $messages;
    }
}
