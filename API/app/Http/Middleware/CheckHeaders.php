<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->header('Content-Type') !== 'application/json') {
            return response()->json([
                'error' => 'Content-Type must be application/json'
            ], 400);
        }

        if (!$request->header('Authorization')) {
            return response()->json([
                'error' => 'Authorization header is missing'
            ], 401);
        }

        return $next($request);
    }
}
