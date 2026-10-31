<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemController extends Controller
{
    public function ping(): JsonResponse
    {
        return ApiResponse::success([
            'app' => 'Brightloop',
            'time' => now()->utc()->toIso8601ZuluString(),
        ]);
    }

    public function pingAuth(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('customer');

        return ApiResponse::success([
            'user' => (new UserResource($user))->resolve($request),
        ]);
    }
}
