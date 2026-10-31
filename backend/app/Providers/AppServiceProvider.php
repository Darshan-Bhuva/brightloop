<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Passport::personalAccessTokensExpireIn(now()->addDays(7));

        Model::preventLazyLoading(! $this->app->isProduction());

        ResetPassword::createUrlUsing(
            fn (User $user, string $token): string => config('app.frontend_url').'/reset-password?token='.$token
                .'&email='.urlencode($user->getEmailForPasswordReset()),
        );
    }
}
