<?php

namespace App\Services;

use App\Enums\Role;
use App\Exceptions\ConflictException;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UserService
{
    public function __construct(private readonly AuthService $authService) {}

    /**
     * USR-01
     *
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters): LengthAwarePaginator
    {
        return User::query()
            ->with('customer')
            ->when(isset($filters['role']), fn ($query) => $query->where('role', $filters['role']))
            ->when(isset($filters['is_active']), fn ($query) => $query->where(
                'is_active',
                filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN),
            ))
            ->when(filled($filters['search'] ?? null), fn ($query) => $query->whereAny(
                ['name', 'email'],
                'ilike',
                '%'.$filters['search'].'%',
            ))
            ->orderBy($filters['sort'] ?? 'created_at', $filters['direction'] ?? 'desc')
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * USR-02: admins create staff accounts only.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): User
    {
        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => Role::Staff,
            'is_active' => true,
        ])->load('customer');
    }

    /**
     * USR-04: no self-deactivation; deactivating revokes every token of the target.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ConflictException
     */
    public function update(User $target, array $data, User $actor): User
    {
        $deactivating = array_key_exists('is_active', $data) && ! (bool) $data['is_active'];

        if ($deactivating && $target->is($actor)) {
            throw new ConflictException('You cannot deactivate your own account.');
        }

        DB::transaction(function () use ($target, $data, $deactivating): void {
            $wasActive = $target->is_active;

            $target->update($data);

            if ($deactivating && $wasActive) {
                $this->authService->revokeAllTokens($target);
            }
        });

        return $target->load('customer');
    }
}
