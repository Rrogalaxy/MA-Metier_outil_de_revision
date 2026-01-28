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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email', 60)->unique();
            $table->string('last_name', 30);
            $table->string('first_name', 30);
            $table->string('password');

            $table->integer('entry_year');
            $table->string('role_name', 100);

            $table->index('role_name');

            $table->foreign('role_name')
                ->references('role_name')->on('roles')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('class_id')->nullable();

            $table->rememberToken();

            //$table->timestamp('email_verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email', 60)->primary();
            $table->string('token');
            $table->foreign('email')
                ->references('email')->on('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('email', 60)->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();

            $table->foreignId('user_id')->nullable()->index();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
