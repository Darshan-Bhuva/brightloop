<?php

namespace App\Models;

use App\Enums\TaxType;
use Database\Factories\TaxFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'type', 'rate', 'is_active'])]
class Tax extends Model
{
    /** @use HasFactory<TaxFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => TaxType::class,
            'rate' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class);
    }
}
