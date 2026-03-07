<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KantorCabangStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:kantor_cabangs,name',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama Kantor Cab wajib diisi',
            'name.unique' => 'Nama Kantor Cab sudah terdaftar',
        ];
    }
}
