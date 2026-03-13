<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class JabatanUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255|unique:jabatans,name,' . $this->route('jabatan'),
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'Nama jabatan sudah terdaftar',
        ];
    }
}
