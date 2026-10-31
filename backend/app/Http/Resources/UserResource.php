<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * Callers must eager-load `customer` (BR-12 prevents lazy loading outside production).
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'is_active' => (bool) $this->is_active,
            'customer_id' => $this->customer?->id,
            'created_at' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
