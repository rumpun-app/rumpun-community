<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sources', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('title');
            $table->string('abbreviation')->nullable();
            $table->string('author')->nullable();
            $table->string('publisher')->nullable();
            $table->string('repository')->nullable();
            $table->text('original_value')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('title');
            $table->index('abbreviation');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sources');
    }
};
