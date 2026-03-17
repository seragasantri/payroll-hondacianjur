<?php

namespace App\Http\Requests;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeUpdateRequest extends FormRequest
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
        $employee = Employee::find($this->route('employee'));
        // dd($employee);

        return [
            'nip' => [
                'required',
                'string',
                Rule::unique('employees', 'nip')->ignore($this->route('employee')),
                Rule::unique('users', 'username')->ignore($employee?->user_id),
            ],
            'nik' => 'required|string|max:20',
            'jenis_kelamin' => 'required|string|in:laki-laki,perempuan',
            'nama' => 'required|string|max:255',
            'password' => 'nullable|string|min:6|confirmed',
            'kantor_cabang_id' => 'required|exists:kantor_cabangs,id',
            'jabatan_id' => 'required|exists:jabatans,id',
            'nomor_rekening' => 'required|string|max:255',
            'kjt' => 'required|string|max:255',
            'status_pegawai' => 'required|string|in:tetap,kontrak,magang',
            'tanggal_mulai_kerja' => 'required|date',
            'ptkp' => 'required|string|in:TK/0,TK/1,TK/2,TK/3,K/0,K/1,K/2,K/3',
            'gaji_pokok' => 'required|numeric|min:0',
            'tunjangan_jabatan' => 'required|numeric|min:0',
            'potongan_tidak_masuk' => 'required|numeric|min:0',
            'potongan_terlambat' => 'required|numeric|min:0',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $nip = $this->input('nip');
            $employeeId = $this->route('employee');

            if (!$nip) {
                return;
            }

            $employee = Employee::find($employeeId);

            // Check if NIP exists in another employee
            $existingEmployee = Employee::where('nip', $nip)
                ->where('id', '!=', $employeeId)
                ->first();

            if ($existingEmployee) {
                $validator->errors()->add('nip', 'NIP sudah terdaftar');
                return;
            }

            // Check if NIP exists in another user (as username)
            $userId = $employee?->user_id;
            $existingUser = User::where('username', $nip)
                ->when($userId, fn($q) => $q->where('id', '!=', $userId))
                ->first();

            if ($existingUser) {
                $validator->errors()->add('nip', 'NIP sudah terdaftar sebagai username user lain');
            }
        });
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
            'nip.string' => 'NIP harus berupa string',
            'nik.required' => 'NIK wajib diisi',
            'jenis_kelamin.required' => 'Jenis kelamin wajib diisi',
            'nama.required' => 'Nama wajib diisi',
            'password.min' => 'Password minimal 6 karakter',
            'password.confirmed' => 'Konfirmasi password tidak cocok',
            'kantor_cabang_id.required' => 'Kantor Cab wajib diisi',
            'kantor_cabang_id.exists' => 'Kantor Cab tidak valid',
            'jabatan_id.required' => 'Jabatan wajib diisi',
            'jabatan_id.exists' => 'Jabatan tidak valid',
            'nomor_rekening.required' => 'Nomor rekening wajib diisi',
            'kjt.required' => 'KJT (Kartu Peserta Jamsostek) wajib diisi',
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
    }
}
