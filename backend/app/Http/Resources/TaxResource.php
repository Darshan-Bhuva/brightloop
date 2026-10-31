<?php

namespace App\Http\Resources;

use App\Enums\TaxType;
use App\Models\Tax;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Tax
 */
class TaxResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type instanceof TaxType ? $this->type->value : (string) $this->type,
            'rate' => number_format((float) $this->rate, 2, '.', ''),
            'is_active' => (bool) $this->is_active,
        ];
    }
}
