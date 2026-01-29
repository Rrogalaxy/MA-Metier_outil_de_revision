<?php

namespace App\Http\Controllers;

use App\Models\StudentClass;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function create(Request $request) : JsonResponse
    {
        $user = auth()->user();

        if($user && ($user->role_name === 'teacher' || $user->role_name === 'admin')){
            for($i = 0; $i <= 100; $i++)
            {
                $class = StudentClass::create([
                    'class_name' => $request->name,
                    'class_year' => date('Y', strtotime('+' . $i . 'year')),
                ]);

                if (!$class->save()){
                    return response()->json([
                        'errors' => $class->getErrors(),
                    ], 400);
                }
            }

            return response()->json([
                'content' => 'la classe ' . $request->name . ' a bien été créé',
            ]);
        } else {
            return response()->json([
                'content' => 'Vous ne possédez pas les droits pour créer une classe'
            ], 401);
        }
    }

    public function index() : JsonResponse
    {
        return response()->json([
            'data' => StudentClass::all()
        ]);
    }

    public function getAllStudentWithClass()
    {
        return response()->json([
            'data' => User::with('studentClass')->where('role_name','=', 'student')->get(),
        ]);
    }
}
