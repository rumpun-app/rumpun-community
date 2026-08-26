<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Database\Factories\MediaFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Media extends Model
{
    use HasFactory;
    use HasUlids;

    protected $table = 'media';

    protected $fillable = [
        'title',
        'original_filename',
        'mime_type',
        'disk',
        'path',
        'size_bytes',
        'original_value',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
        ];
    }

    public function facts(): BelongsToMany
    {
        return $this->belongsToMany(Fact::class, 'fact_media', 'media_id', 'fact_id')
            ->withTimestamps();
    }

    public function people(): BelongsToMany
    {
        return $this->belongsToMany(Person::class, 'person_media', 'media_id', 'person_id')
            ->withTimestamps();
    }

    protected static function newFactory(): Factory
    {
        return MediaFactory::new();
    }
}
