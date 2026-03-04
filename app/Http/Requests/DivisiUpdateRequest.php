<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DivisiUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255|unique:divisis,name,' . $this->route('id'),
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'Nama divisi sudah terdaftar',
        ];
    }
}
