<?php

namespace App\Services;

use App\Exceptions\ConflictException;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Tax;

class TaxService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Tax
    {
        return Tax::create([
            'name' => $data['name'],
            'type' => $data['type'],
            'rate' => $data['rate'],
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Tax $tax, array $data): Tax
    {
        $tax->update([
            'name' => $data['name'],
            'type' => $data['type'],
            'rate' => $data['rate'],
            'is_active' => $data['is_active'] ?? $tax->is_active,
        ]);

        return $tax;
    }

    public function delete(Tax $tax): void
    {
        $inUse = Product::where('tax_id', $tax->id)->exists()
            || Plan::where('tax_id', $tax->id)->exists();

        if ($inUse) {
            throw new ConflictException('Tax is in use; deactivate it instead');
        }

        $tax->delete();
    }
}
