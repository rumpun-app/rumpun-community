<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('citation_fact', function (Blueprint $table): void {
            $table->foreignUlid('citation_id')->constrained('citations')->cascadeOnDelete();
            $table->foreignUlid('fact_id')->constrained('facts')->cascadeOnDelete();
            $table->integer('confidence')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->primary(['citation_id', 'fact_id']);
            $table->index('fact_id');
        });

        Schema::create('citation_relationship', function (Blueprint $table): void {
            $table->foreignUlid('citation_id')->constrained('citations')->cascadeOnDelete();
            $table->foreignId('relationship_id')->constrained('relationships')->cascadeOnDelete();
            $table->integer('confidence')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->primary(['citation_id', 'relationship_id']);
            $table->index('relationship_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('citation_relationship');
        Schema::dropIfExists('citation_fact');
    }
};
