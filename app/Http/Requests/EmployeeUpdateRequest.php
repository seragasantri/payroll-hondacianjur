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
            'password' => 'nullable|string|min:8|confirmed',
            'divisi' => 'sometimes|string|max:255',
            'jabatan' => 'sometimes|string|max:255',
            'tanggal_mulai_kerja' => 'sometimes|date',
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
            'password.min' => 'Password minimal 8 karakter',
            'password.confirmed' => 'Konfirmasi password tidak cocok',
            'gaji_pokok.numeric' => 'Gaji pokok harus berupa angka',
            'tunjangan_jabatan.numeric' => 'Tunjangan jabatan harus berupa angka',
        ];
    }
}
