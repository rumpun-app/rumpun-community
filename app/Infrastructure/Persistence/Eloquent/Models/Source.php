<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Database\Factories\SourceFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Source extends Model
{
    use HasFactory;
    use HasUlids;

    protected $table = 'sources';

    protected $fillable = [
        'title',
        'abbreviation',
        'author',
        'publisher',
        'repository',
        'original_value',
        'notes',
    ];

    public function citations(): HasMany
    {
        return $this->hasMany(Citation::class, 'source_id');
    }

    protected static function newFactory(): Factory
    {
        return SourceFactory::new();
    }
}
