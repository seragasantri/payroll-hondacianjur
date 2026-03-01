<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PermissionUpdateRequest extends FormRequest
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
        $permissionId = $this->route('id');

        return [
            'name' => 'required|string|max:255|unique:permissions,name,' . $permissionId,
            'guard_name' => 'nullable|string|max:255',
            'module' => 'nullable|string|max:255',
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
            'name.required' => 'Nama permission wajib diisi.',
            'name.unique' => 'Nama permission sudah ada.',
            'name.max' => 'Nama permission maksimal 255 karakter.',
            'guard_name.max' => 'Guard name maksimal 255 karakter.',
            'module.max' => 'Module maksimal 255 karakter.',
        ];
    }
}
