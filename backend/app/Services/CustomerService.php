<?php

namespace App\Services;

use App\Enums\SubscriptionStatus;
use App\Exceptions\ConflictException;
use App\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class CustomerService
{
    /**
     * CUS-01: paginated, or up to 500 rows when `all` is truthy (dropdown mode).
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator|Collection<int, Customer>
     */
    public function list(array $filters): LengthAwarePaginator|Collection
    {
        $query = Customer::query()
            ->withCount(Customer::activeSubscriptionsCount())
            ->when(filled($filters['search'] ?? null), fn ($query) => $query->whereAny(
                ['name', 'email', 'company_name'],
                'ilike',
                '%'.$filters['search'].'%',
            ))
            ->when(isset($filters['has_login']), fn ($query) => filter_var($filters['has_login'], FILTER_VALIDATE_BOOLEAN)
                ? $query->whereNotNull('user_id')
                : $query->whereNull('user_id'))
            ->orderBy($filters['sort'] ?? 'created_at', $filters['direction'] ?? 'desc')
            ->orderBy('id');

        if (filter_var($filters['all'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            return $query->limit(500)->get();
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    /**
     * CUS-02: `user_id` is never taken from the request.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Customer
    {
        return $this->withCounts(Customer::create($data));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Customer $customer, array $data): Customer
    {
        $customer->update($data);

        return $this->withCounts($customer);
    }

    /**
     * CUS-05: blocked while the customer has confirmed/active subscriptions or unpaid invoices.
     *
     * @throws ConflictException
     */
    public function delete(Customer $customer): void
    {
        $inUse = $customer->subscriptions()
            ->whereIn('status', [SubscriptionStatus::Confirmed, SubscriptionStatus::Active])
            ->exists()
            || $customer->invoices()->where('amount_due', '>', 0)->exists();

        if ($inUse) {
            throw new ConflictException('Customer has confirmed or active subscriptions or unpaid invoices.');
        }

        $customer->delete();
    }

    public function withCounts(Customer $customer): Customer
    {
        return $customer->loadCount(Customer::activeSubscriptionsCount());
    }
}
