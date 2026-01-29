<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware(['auth:sanctum', 'checkHeaders'])->group(function(): void {
    // ----- ROUTES ACTIVITY ----- //
    Route::post('/activity/create', [ActivityController::class, 'create']);

    // ----- ROUTE CLASS ----- //
    Route::post('/class/create', [ClassController::class, 'create']);

    // ----- ROUTES STUDENT ----- //
    Route::get('/student/class', [ClassController::class, 'index']);
    Route::post('/student/addClass', [UserController::class, 'addStudentToClass']);
    Route::post('/student', [UserController::class, 'getUser']);

    // ----- ROUTE COURSE ----- //
    Route::post('class/course', [CourseController::class, 'addCourseToClass']);
});

// ----- ROUTES AUTENTIFICAITON ----- //
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ----- ROUTE CLASS ----- //
Route::get('/class', [ClassController::class, 'index']);
