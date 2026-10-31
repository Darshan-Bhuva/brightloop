<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\ListUsersRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService) {}

    public function index(ListUsersRequest $request): JsonResponse
    {
        return ApiResponse::paginated($this->userService->list($request->validated()), UserResource::class);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        return ApiResponse::created(new UserResource($this->userService->create($request->validated())));
    }

    public function show(User $user): JsonResponse
    {
        return ApiResponse::success(new UserResource($user->load('customer')));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->userService->update($user, $request->validated(), $request->user());

        return ApiResponse::success(new UserResource($user));
    }
}
