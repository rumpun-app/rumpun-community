<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Person;
use Database\Factories\FactFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Fact extends Model
{
    use HasFactory;
    use HasUlids;

    protected $table = 'facts';

    protected $fillable = [
        'person_id',
        'type',
        'value',
        'date_type',
        'date_from',
        'date_to',
        'date_text',
        'date_is_approximate',
        'is_disputed',
        'place_id',
        'original_value',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'date_from' => 'date',
            'date_to' => 'date',
            'date_is_approximate' => 'boolean',
            'is_disputed' => 'boolean',
        ];
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'person_id');
    }

    public function place(): BelongsTo
    {
        return $this->belongsTo(Place::class, 'place_id');
    }

    public function citations(): BelongsToMany
    {
        return $this->belongsToMany(Citation::class, 'citation_fact', 'fact_id', 'citation_id')
            ->withPivot(['confidence', 'notes'])
            ->withTimestamps();
    }

    public function media(): BelongsToMany
    {
        return $this->belongsToMany(Media::class, 'fact_media', 'fact_id', 'media_id')
            ->withTimestamps();
    }

    protected static function newFactory(): Factory
    {
        return FactFactory::new();
    }
}
