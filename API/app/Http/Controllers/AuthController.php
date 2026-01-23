<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
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

        $token = $this->createToken($user);

        return response()->json([
            'token' => $token,
            'type' => 'Bearer',
        ]);
    }

    public function register(Request $request) : JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:60|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'first_name' => 'required|string|max:30',
            'last_name' => 'required|string|max:30'
        ]);

        if($validator->fails())
        {
            return response()->json($validator->errors(), 400);
        }

        $user = User::create(['email' => request('email'), 'password' => Hash::make(request('password')), 'first_name' => request('first_name'), 'last_name' => request('last_name'), 'role_name' => 'student', 'entry-year' => date('Y')]);
        $user->setRememberToken(Str::random(10));
        $user->save();

        $token = $this->createToken($user);

        return response()->json([
            'token' => $token,
            'type' => 'Bearer',
        ]);
    }

    private function createToken($user)
    {
        $plainToken = Str::random(40);

        PersonalAccessToken::create([
            'email' => $user->email,
            'name' => 'api-token',
            'token' => hash('sha256', $plainToken),
            'abilities' => json_encode(['*']),
        ]);

        return $plainToken;
    }
}
