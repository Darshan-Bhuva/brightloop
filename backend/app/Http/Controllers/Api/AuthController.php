<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuthService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        [$user, $token] = $this->authService->register($request->validated());

        return ApiResponse::created($this->tokenPayload($request, $user, $token));
    }

    public function login(LoginRequest $request): JsonResponse
    {
        [$user, $token] = $this->authService->login($request->validated('email'), $request->validated('password'));

        return ApiResponse::success($this->tokenPayload($request, $user, $token));
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return ApiResponse::success(null);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $this->authService->loadProfile($request->user());

        return ApiResponse::success($this->profilePayload($request, $user));
    }

    public function updateMe(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->authService->updateProfile($request->user(), $request->validated());

        return ApiResponse::success($this->profilePayload($request, $user));
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->authService->sendResetLink($request->validated('email'));

        return ApiResponse::success(null, 'If the email exists, a reset link has been sent.');
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $this->authService->resetPassword($request->validated());

        return ApiResponse::success(null);
    }

    /**
     * @return array{user: array<string, mixed>, token: string, token_type: string}
     */
    private function tokenPayload(Request $request, User $user, string $token): array
    {
        return [
            'user' => (new UserResource($user))->resolve($request),
            'token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    /**
     * @return array{user: array<string, mixed>, customer: array<string, mixed>|null}
     */
    private function profilePayload(Request $request, User $user): array
    {
        return [
            'user' => (new UserResource($user))->resolve($request),
            'customer' => $user->customer ? (new CustomerResource($user->customer))->resolve($request) : null,
        ];
    }
}
