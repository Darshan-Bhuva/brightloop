<?php

use App\Http\Controllers\Api\SystemController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', [SystemController::class, 'ping']);
Route::get('/ping/auth', [SystemController::class, 'pingAuth'])->middleware(['auth:api', 'role:admin,staff,customer']);
