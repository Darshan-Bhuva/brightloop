<?php

namespace App\Models;

use Database\Factories\QuotationTemplateLineFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['quotation_template_id', 'product_id', 'variant_id', 'quantity'])]
class QuotationTemplateLine extends Model
{
    /** @use HasFactory<QuotationTemplateLineFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(QuotationTemplate::class, 'quotation_template_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
