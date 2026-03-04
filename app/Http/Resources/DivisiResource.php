<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\EmployeeResource;

class DivisiResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Include employees count if loaded
            'employees_count' => $this->whenLoaded('employees', fn() => $this->employees->count()),
            // Include employees data if loaded
            'employees' => $this->whenLoaded('employees', fn() => EmployeeResource::collection($this->employees)),
        ];
    }
}
