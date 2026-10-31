<?php

namespace App\Http\Resources;

use App\Models\PaymentTerm;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PaymentTerm
 */
class PaymentTermResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'due_days' => (int) $this->due_days,
        ];
    }
}
