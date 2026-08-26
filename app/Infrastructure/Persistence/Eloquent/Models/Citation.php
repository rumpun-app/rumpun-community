<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Database\Factories\CitationFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Citation extends Model
{
    use HasFactory;
    use HasUlids;

    protected $table = 'citations';

    protected $fillable = [
        'source_id',
        'page',
        'excerpt',
        'confidence',
        'original_value',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'confidence' => 'integer',
        ];
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(Source::class, 'source_id');
    }

    public function facts(): BelongsToMany
    {
        return $this->belongsToMany(Fact::class, 'citation_fact', 'citation_id', 'fact_id')
            ->withPivot(['confidence', 'notes'])
            ->withTimestamps();
    }

    public function relationships(): BelongsToMany
    {
        return $this->belongsToMany(Relationship::class, 'citation_relationship', 'citation_id', 'relationship_id')
            ->withPivot(['confidence', 'notes'])
            ->withTimestamps();
    }

    protected static function newFactory(): Factory
    {
        return CitationFactory::new();
    }
}
