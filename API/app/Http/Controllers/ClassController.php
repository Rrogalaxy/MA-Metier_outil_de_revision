<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\StudentClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use function Illuminate\Support\years;

class ClassController extends Controller
{
    public function create(Request $request) : JsonResponse {
        $validator = Validator::make($request->all(), [
            'class_id' => 'required|string',
            'class_year' => 'require|integer',
        ]);

        if($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        for($i = 0; $i <= 100; $i++)
        {
            $class = StudentClass::create([
                'class_id' => request('class_id'),
                'class_year' => date('Y', strtotime('+' . $i . 'year')),
            ]);

            $class->save();
        }

        return response()->json([
            'content' => 'la classe ' . request('class_id') . ' a bien été créé',
        ]);
    }

    public function index() : JsonResponse
    {
        return response()->json(StudentClass::all());
    }
}
