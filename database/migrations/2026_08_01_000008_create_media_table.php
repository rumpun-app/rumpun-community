<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->string('title')->nullable();
            $table->string('original_filename')->nullable();
            $table->string('mime_type')->nullable();
            $table->string('disk')->default('local');
            $table->string('path')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->text('original_value')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('mime_type');
        });

        Schema::create('fact_media', function (Blueprint $table): void {
            $table->foreignUlid('fact_id')->constrained('facts')->cascadeOnDelete();
            $table->foreignUlid('media_id')->constrained('media')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['fact_id', 'media_id']);
        });

        Schema::create('person_media', function (Blueprint $table): void {
            $table->foreignId('person_id')->constrained('people')->cascadeOnDelete();
            $table->foreignUlid('media_id')->constrained('media')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['person_id', 'media_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('person_media');
        Schema::dropIfExists('fact_media');
        Schema::dropIfExists('media');
    }
};
