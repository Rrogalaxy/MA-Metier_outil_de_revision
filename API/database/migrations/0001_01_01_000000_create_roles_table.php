<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->string('role_name', 100)->primary();
        });

        DB::statement("
            ALTER TABLE roles
            ADD CONSTRAINT chk_roles_allowed
            CHECK (role_name IN ('student','teacher','admin'))
        ");

        DB::table('roles')->insert([
            ['role_name' => 'student'],
            ['role_name' => 'teacher'],
            ['role_name' => 'admin'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
