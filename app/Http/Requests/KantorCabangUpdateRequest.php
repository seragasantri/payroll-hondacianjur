<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KantorCabangUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255|unique:kantor_cabangs,name,' . $this->route('kantor-cabang') . ',id',
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'Nama Kantor Cab sudah terdaftar',
        ];
    }
}
