<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facts', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignId('person_id')->constrained('people')->cascadeOnDelete();
            $table->string('type');
            $table->string('value')->nullable();
            $table->string('date_type')->nullable();
            $table->date('date_from')->nullable();
            $table->date('date_to')->nullable();
            $table->string('date_text')->nullable();
            $table->boolean('date_is_approximate')->default(false);
            $table->boolean('is_disputed')->default(false);
            $table->foreignUlid('place_id')->nullable()->constrained('places')->nullOnDelete();
            $table->text('original_value')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('person_id');
            $table->index('type');
            $table->index(['person_id', 'type']);
            $table->index('place_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facts');
    }
};
