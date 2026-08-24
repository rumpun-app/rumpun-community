<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('people', function (Blueprint $table): void {
            $table->id();
            $table->string('given_name');
            $table->string('family_name');
            $table->string('middle_name')->nullable();
            $table->string('prefix')->nullable();
            $table->string('suffix')->nullable();
            $table->string('sex', 16)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('birth_place')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('people');
    }
};
