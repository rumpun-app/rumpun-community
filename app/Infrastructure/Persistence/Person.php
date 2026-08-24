<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use Database\Factories\PersonFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Person extends Model
{
    /** @use HasFactory<PersonFactory> */
    use HasFactory;

    protected static function newFactory(): PersonFactory
    {
        return PersonFactory::new();
    }

    protected $table = 'people';

    protected $fillable = [
        'given_name',
        'family_name',
        'middle_name',
        'prefix',
        'suffix',
        'sex',
        'birth_date',
        'birth_place',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    /** @return HasMany<Relationship, $this> */
    public function relationshipsFrom(): HasMany
    {
        return $this->hasMany(Relationship::class, 'from_person_id');
    }

    /** @return HasMany<Relationship, $this> */
    public function relationshipsTo(): HasMany
    {
        return $this->hasMany(Relationship::class, 'to_person_id');
    }

    public function displayName(): string
    {
        $parts = array_filter([
            $this->prefix,
            $this->given_name,
            $this->middle_name,
            $this->family_name,
            $this->suffix,
        ], fn (?string $v) => $v !== null && trim($v) !== '');

        return implode(' ', $parts);
    }
}
