<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\StudentClass;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory(3)->create(['role_name' => 'student', 'entry_year' => date('Y')]);

        User::create(['email' => 'ricardo.cardoso@eduvaud.ch', 'password' => '12345678', 'first_name' => 'Ricardo', 'last_name' => 'Cardoso', 'role_name' => 'student', 'entry_year' => date('Y')]);
        User::create(['email' => 'ricardo.cardoso.teacher@eduvaud.ch', 'password' => '12345678', 'first_name' => 'Ricardo(Teacher)', 'last_name' => 'Cardoso(Teacher)', 'role_name' => 'teacher', 'entry_year' => date('Y')]);

        for($i = 0; $i < 100; $i++) {
            StudentClass::create(['class_name' => 'SI-T1a', 'class_year' => date('Y', strtotime('+' . $i . 'year'))]);
        }

        Course::create(['course_name' => 'PRW2', 'start_time' => date('H:i'), 'end_time' => date('H:i', strtotime('+2 hours')), 'day' => 'monday']);

//        User::factory()->create([
//            'name' => 'Test User',
//            'email' => 'test@example.com',
//        ]);
    }
}
