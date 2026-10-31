<?php

namespace App\Services;

use App\Models\QuotationTemplate;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class QuotationTemplateService
{
    /**
     * Relations the QuotationTemplateResource needs (BR-12: always eager-loaded here).
     *
     * @return array<int|string, mixed>
     */
    public static function relations(): array
    {
        return [
            'plan' => fn ($query) => $query->withTrashed(),
            'lines.product' => fn ($query) => $query->withTrashed(),
            'lines.variant' => fn ($query) => $query->withTrashed(),
        ];
    }

    /**
     * TPL-01: paginated, or up to 500 rows when `all` is truthy (dropdown mode).
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator|Collection<int, QuotationTemplate>
     */
    public function list(array $filters): LengthAwarePaginator|Collection
    {
        $query = QuotationTemplate::query()
            ->with(self::relations())
            ->when(filled($filters['search'] ?? null), fn ($query) => $query->where('name', 'ilike', '%'.$filters['search'].'%'))
            ->orderBy($filters['sort'] ?? 'created_at', $filters['direction'] ?? 'desc')
            ->orderBy('id');

        if (filter_var($filters['all'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            return $query->limit(500)->get();
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    /**
     * TPL-02
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $user): QuotationTemplate
    {
        return DB::transaction(function () use ($data, $user) {
            $template = QuotationTemplate::create([
                'name' => $data['name'],
                'validity_days' => $data['validity_days'],
                'plan_id' => $data['plan_id'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $user->id,
            ]);

            $this->createLines($template, $data['lines']);

            return $template->load(self::relations());
        });
    }

    /**
     * TPL-04: lines are replaced.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(QuotationTemplate $template, array $data): QuotationTemplate
    {
        return DB::transaction(function () use ($template, $data) {
            $template->update([
                'name' => $data['name'],
                'validity_days' => $data['validity_days'],
                'plan_id' => $data['plan_id'],
                'notes' => $data['notes'] ?? null,
            ]);

            $template->lines()->delete();
            $this->createLines($template, $data['lines']);

            return $template->load(self::relations());
        });
    }

    /**
     * TPL-05: soft delete.
     */
    public function delete(QuotationTemplate $template): void
    {
        $template->delete();
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     */
    private function createLines(QuotationTemplate $template, array $lines): void
    {
        $template->lines()->createMany(array_map(fn (array $line) => [
            'product_id' => $line['product_id'],
            'variant_id' => $line['variant_id'] ?? null,
            'quantity' => $line['quantity'],
        ], $lines));
    }
}
