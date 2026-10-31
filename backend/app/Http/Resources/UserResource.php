<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\AbstractCursorPaginator;
use Illuminate\Pagination\AbstractPaginator;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * Callers should still eager-load `customer` (with('customer') / loadMissing('customer')).
     * As a safety net the resource loads it itself: one query for a single user, one batched
     * query for a collection or paginator, so BR-12 preventLazyLoading never throws here.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing('customer');

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

    /**
     * Batch-load `customer` for the whole collection so toArray() never queries per item.
     */
    protected static function newCollection($resource)
    {
        if ($resource instanceof EloquentCollection) {
            $resource->loadMissing('customer');
        } elseif ($resource instanceof AbstractPaginator || $resource instanceof AbstractCursorPaginator) {
            $resource->getCollection()->loadMissing('customer');
        }

        return parent::newCollection($resource);
    }
}
