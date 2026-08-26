<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Database\Factories\PlaceFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Place extends Model
{
    use HasFactory;
    use HasUlids;

    protected $table = 'places';

    protected $fillable = [
        'name',
        'normalized_name',
        'latitude',
        'longitude',
        'original_value',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function facts(): HasMany
    {
        return $this->hasMany(Fact::class, 'place_id');
    }

    protected static function newFactory(): Factory
    {
        return PlaceFactory::new();
    }
}
