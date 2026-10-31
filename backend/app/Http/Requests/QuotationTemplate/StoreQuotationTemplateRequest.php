<?php

namespace App\Http\Requests\QuotationTemplate;

use App\Models\ProductVariant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreQuotationTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'validity_days' => ['required', 'integer', 'min:1', 'max:365'],
            'plan_id' => ['required', 'integer', Rule::exists('plans', 'id')->withoutTrashed()],
            'notes' => ['nullable', 'string'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.product_id' => ['required', 'integer', Rule::exists('products', 'id')->withoutTrashed()],
            'lines.*.variant_id' => ['nullable', 'integer'],
            'lines.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Each variant must belong to its line's product.
     *
     * @return array<int, \Closure>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $lines = $this->input('lines');

                if (! is_array($lines)) {
                    return;
                }

                $variants = ProductVariant::whereIn('id', array_filter(array_column($lines, 'variant_id'), 'is_numeric'))
                    ->pluck('product_id', 'id');

                foreach ($lines as $index => $line) {
                    $variantId = is_array($line) ? ($line['variant_id'] ?? null) : null;

                    if (filled($variantId) && is_numeric($variantId)
                        && (int) ($variants[(int) $variantId] ?? 0) !== (int) ($line['product_id'] ?? 0)) {
                        $validator->errors()->add("lines.{$index}.variant_id", 'The selected variant does not belong to the product.');
                    }
                }
            },
        ];
    }
}
