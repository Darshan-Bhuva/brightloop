<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * AUTH-01: create a customer user and its customer profile (or link an unlinked staff-created one).
     *
     * @param  array<string, mixed>  $data
     * @return array{0: User, 1: string}
     */
    public function register(array $data): array
    {
        $user = DB::transaction(function () use ($data): User {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => Role::Customer,
                'is_active' => true,
            ]);

            $customer = Customer::withTrashed()
                ->whereRaw('lower(email) = ?', [$user->email])
                ->lockForUpdate()
                ->first();

            if ($customer === null) {
                Customer::create([
                    'user_id' => $user->id,
                    'name' => $data['name'],
                    'email' => $user->email,
                    'phone' => $data['phone'] ?? null,
                    'company_name' => $data['company_name'] ?? null,
                ]);
            } elseif (! $customer->trashed() && $customer->user_id === null) {
                $customer->update(['user_id' => $user->id]);
            } else {
                throw ValidationException::withMessages(['email' => ['The email has already been taken.']]);
            }

            return $user;
        });

        return [$this->loadProfile($user), $this->issueToken($user)];
    }

    /**
     * AUTH-02: 401 for bad credentials, 403 for deactivated accounts.
     *
     * @return array{0: User, 1: string}
     */
    public function login(string $email, string $password): array
    {
        $user = User::where('email', strtolower($email))->first();

        if ($user === null || ! Hash::check($password, $user->password)) {
            abort(401, 'Invalid email or password');
        }

        if (! $user->is_active) {
            abort(403, 'Account is deactivated');
        }

        return [$this->loadProfile($user), $this->issueToken($user)];
    }

    /**
     * AUTH-03: revoke only the token used for this request.
     */
    public function logout(User $user): void
    {
        $user->token()?->revoke();
    }

    /**
     * AUTH-05: the response never reveals whether the email exists.
     */
    public function sendResetLink(string $email): void
    {
        Password::sendResetLink(['email' => $email]);
    }

    /**
     * AUTH-06: set the new password and revoke every token of the user.
     *
     * @param  array<string, mixed>  $data
     */
    public function resetPassword(array $data): void
    {
        $status = Password::reset(
            [
                'email' => $data['email'],
                'password' => $data['password'],
                'password_confirmation' => $data['password_confirmation'],
                'token' => $data['token'],
            ],
            function (User $user, string $password): void {
                $user->forceFill(['password' => $password])->setRememberToken(Str::random(60));
                $user->save();

                $this->revokeAllTokens($user);

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PasswordReset) {
            throw ValidationException::withMessages(['email' => ['This password reset token is invalid.']]);
        }
    }

    /**
     * AUTH-07: admin/staff change only `name`; customers also update their customer profile.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateProfile(User $user, array $data): User
    {
        DB::transaction(function () use ($user, $data): void {
            $user->update(['name' => $data['name']]);

            if ($user->role !== Role::Customer) {
                return;
            }

            $customer = $user->customer()->first();

            $customer?->update(array_intersect_key($data, array_flip([
                'name', 'phone', 'company_name', 'address_line', 'city', 'state', 'country', 'postal_code',
            ])));
        });

        return $this->loadProfile($user);
    }

    /**
     * Load the user's customer profile with the counts CustomerResource needs.
     */
    public function loadProfile(User $user): User
    {
        return $user->load(['customer' => fn ($query) => $query->withCount(Customer::activeSubscriptionsCount())]);
    }

    public function revokeAllTokens(User $user): void
    {
        $user->tokens()->update(['revoked' => true]);
    }

    private function issueToken(User $user): string
    {
        return $user->createToken('auth')->accessToken;
    }
}
