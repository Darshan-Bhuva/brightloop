<?php

namespace App\Models;

use Database\Factories\PaymentTermFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'due_days'])]
class PaymentTerm extends Model
{
    /** @use HasFactory<PaymentTermFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_days' => 'integer',
        ];
    }
}
