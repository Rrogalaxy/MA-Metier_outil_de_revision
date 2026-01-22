<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(Request $request) : JsonResponse {

        $request->validate([
            'email' => 'required||email|',
            'password' => 'required',
        ]);

        $user = User::where('email', request('email'))->first();

        if (!$user || !Hash::check(request('password'), $user->password)) {
            return response()->json([
                "message" => "Email ou mot de passe incorrecte"
            ], 401);
        }

        $plainToken = Str::random(40);

        PersonalAccessToken::create([
            'email' => $user->email,
            'name' => 'api-token',
            'token' => hash('sha256', $plainToken),
            'abilities' => json_encode(['*']),
        ]);

        return response()->json([
            'token' => $plainToken,
            'type' => 'Bearer',
        ]);
    }
}
