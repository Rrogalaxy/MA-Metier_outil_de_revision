<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login() : JsonResponse {

        $user = User::where('email', request('email'))->first();

        if (!$user || !Hash::check(request('password'), $user->password)) {
            return response()->json([
                "message" => "Email ou mot de passe incorrecte"
            ]);
        }

        return response()->json([
            "token" => $user->createToken('auth_token')->plainTextToken,
        ]);
    }

}
