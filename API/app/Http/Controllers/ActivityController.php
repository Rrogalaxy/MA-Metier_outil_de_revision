<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function create(Request $request)
    {
        $user = auth()->user();

        $activity = $user->activities()->create([
            'activity_name' => $request->activity_name,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'day' => $request->day,
        ]);

        if (!$activity->save()){
            return response()->json([
                'errors' => $activity->getErrors(),
            ], 400);
        }

        return response()->json([
            'activity' => $activity->toArray(),
            'user' => $user->toArray(),
        ]);
    }
}
