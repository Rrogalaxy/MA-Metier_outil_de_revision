<?php

namespace App\Http\Controllers;

use App\Models\StudentClass;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function addStudentToClass(Request $request) : JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'class_name' => 'required|string',
        ]);

        if($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $user = User::where('email', $request->email)->first();

        $class = StudentClass::where(['class_name' => $request->class_name, 'class_year' => $user->entry_year])->first();

        $user->studentClass()->associate($class);
        $user->class_id = $class->class_id;
        $user->save();

        return response()->json([
            'content' => $user->last_name . ' ' . $user->first_name . ' fait partie de la classe ' . $user->studentClass->class_name
        ]);
    }

    public function getUser(Request $request) : JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        return response()->json([
        'user' => $user->toArray(),
        ]);
    }
}
