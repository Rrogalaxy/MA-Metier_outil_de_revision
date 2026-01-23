<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function(): void {

});


// ----- ROUTE AUTENTIFICAITON ----- //
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);


// ----- ROUTE CLASS ----- //
route::post('/class/create', [ClassController::class, 'create']);
route::get('class', [ClassController::class, 'index']);
