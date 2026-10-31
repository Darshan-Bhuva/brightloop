<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Allow the request only for active users whose role is in the given list.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            throw new AuthenticationException;
        }

        if (! $user->is_active) {
            abort(403, 'Account is deactivated');
        }

        if ($roles !== [] && ! in_array($user->role->value, $roles, true)) {
            abort(403, 'This action is unauthorized.');
        }

        return $next($request);
    }
}
