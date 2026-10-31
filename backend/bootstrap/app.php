<?php

use App\Exceptions\ConflictException;
use App\Http\Middleware\EnsureRole;
use App\Support\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['role' => EnsureRole::class]);

        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : '/login');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*') || $e instanceof HttpResponseException) {
                return null;
            }

            return match (true) {
                $e instanceof ValidationException => ApiResponse::error('The given data was invalid.', 422, $e->errors()),
                $e instanceof AuthenticationException => ApiResponse::error('Unauthenticated.', 401),
                $e instanceof ConflictException => ApiResponse::error($e->getMessage(), 409),
                $e instanceof HttpExceptionInterface => ApiResponse::error(
                    $e->getStatusCode() === 404
                        ? 'Resource not found.'
                        : ($e->getMessage() !== '' ? $e->getMessage() : (Response::$statusTexts[$e->getStatusCode()] ?? 'Error')),
                    $e->getStatusCode(),
                )->withHeaders($e->getHeaders()),
                default => ApiResponse::error(config('app.debug') ? $e->getMessage() : 'Server Error', 500),
            };
        });
    })->create();
