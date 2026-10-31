<?php

namespace App\Http\Requests\Catalog;

use App\Enums\ProductType;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends FormRequest
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
        $product = $this->route('product');
        $productId = $product instanceof Product ? $product->id : $product;

        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(ProductType::class)],
            'sales_price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'tax_id' => ['nullable', 'integer', 'exists:taxes,id'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'variants' => ['nullable', 'array'],
            'variants.*.id' => [
                'nullable',
                'integer',
                Rule::exists('product_variants', 'id')->where(function ($query) use ($productId) {
                    $query->where('product_id', $productId)
                        ->whereNull('deleted_at');
                }),
            ],
            'variants.*.attribute' => ['required', 'string', 'max:100'],
            'variants.*.value' => ['required', 'string', 'max:100'],
            'variants.*.extra_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<int, \Closure>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $variants = $this->input('variants');
                if (! is_array($variants)) {
                    return;
                }

                $seen = [];
                foreach ($variants as $index => $variant) {
                    if (! is_array($variant) || ! isset($variant['attribute'], $variant['value'])) {
                        continue;
                    }

                    $key = mb_strtolower(trim((string) $variant['attribute'])).':'.mb_strtolower(trim((string) $variant['value']));
                    if (isset($seen[$key])) {
                        $validator->errors()->add(
                            "variants.{$index}.value",
                            'Duplicate variant attribute and value combinations are not allowed.',
                        );
                        $validator->errors()->add(
                            'variants',
                            'Duplicate variant attribute and value combinations are not allowed.',
                        );
                    }
                    $seen[$key] = true;
                }
            },
        ];
    }
}
