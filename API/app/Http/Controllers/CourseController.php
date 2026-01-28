<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\StudentClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CourseController extends Controller
{
    public function addCourseToClass(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name_class' => 'required|string',
            'year_class' => 'required|integer',
            'name_course' => 'required|string',
        ]);

        if($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $course = Course::where('course_name', $request->name_course)->first();

        $class = StudentClass::where(['class_name' => $request->name_class, 'class_year' => $request->year_class])->first();

        $class->courses()->attach($course->course_id);

        return response()->json([
            'course' => $course->toArray(),
            'class' => $class->toArray(),
        ]);
    }
}
