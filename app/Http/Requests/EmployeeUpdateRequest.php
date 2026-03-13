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
            'nama' => 'sometimes|string|max:255',
            'password' => 'nullable|string|min:6|confirmed',
            'kantor_cabang_id' => 'sometimes|exists:kantor_cabangs,id',
            'jabatan_id' => 'sometimes|exists:jabatans,id',
            'nomor_rekening' => 'nullable|string|max:255',
            'status_pegawai' => 'nullable|string|in:Pegawai Tetap,Pegawai Kontrak',
            'tanggal_mulai_kerja' => 'sometimes|date',
            'ptkp' => 'nullable|string|in:TK/0,TK/1,TK/2,TK/3,K/0,K/1,K/2,K/3',
            'gaji_pokok' => 'sometimes|numeric|min:0',
            'tunjangan_jabatan' => 'sometimes|numeric|min:0',
            'potongan_tidak_masuk' => 'sometimes|numeric|min:0',
            'potongan_terlambat' => 'sometimes|numeric|min:0',
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
            'nip.string' => 'NIP harus berupa string',
            'password.min' => 'Password minimal 6 karakter',
            'password.confirmed' => 'Konfirmasi password tidak cocok',
            'kantor_cabang_id.exists' => 'Kantor Cab tidak valid',
            'jabatan_id.exists' => 'Jabatan tidak valid',
            'gaji_pokok.numeric' => 'Gaji pokok harus berupa angka',
            'tunjangan_jabatan.numeric' => 'Tunjangan jabatan harus berupa angka',
        ];
    }
}
