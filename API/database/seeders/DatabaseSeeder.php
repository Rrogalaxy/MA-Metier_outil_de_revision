<?php

namespace Database\Seeders;

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

        for($i = 0; $i < 100; $i++) {
            StudentClass::create(['class_name' => 'SI-T1a', 'class_year' => date('Y', strtotime('+' . $i . 'year'))]);
        }

//        User::factory()->create([
//            'name' => 'Test User',
//            'email' => 'test@example.com',
//        ]);
    }
}
