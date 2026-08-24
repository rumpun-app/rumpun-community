<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('relationships', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('from_person_id')->constrained('people')->cascadeOnDelete();
            $table->foreignId('to_person_id')->constrained('people')->cascadeOnDelete();
            $table->string('type', 32);
            $table->timestamps();

            $table->unique(['from_person_id', 'to_person_id', 'type']);
            $table->index(['to_person_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relationships');
    }
};
