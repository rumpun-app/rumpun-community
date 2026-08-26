<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('citations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('source_id')->constrained('sources')->cascadeOnDelete();
            $table->string('page')->nullable();
            $table->text('excerpt')->nullable();
            $table->integer('confidence')->nullable();
            $table->text('original_value')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('source_id');
            $table->index('confidence');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('citations');
    }
};
