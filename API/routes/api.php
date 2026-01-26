<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/test', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function(): void {

});


// ----- ROUTES AUTENTIFICAITON ----- //
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ----- ROUTES USER ----- //
Route::post('/user/class', [UserController::class, 'addUserToClass']);


// ----- ROUTES CLASS ----- //
route::post('/class/create', [ClassController::class, 'create']);
route::get('/class', [ClassController::class, 'index']);


// ----- ROUTE STUDENT ----- //
route::get('/student/class', [ClassController::class, 'getAllStudentWithClass']);
