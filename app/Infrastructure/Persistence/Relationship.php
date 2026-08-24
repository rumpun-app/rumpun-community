<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Relationship extends Model
{
    protected $fillable = [
        'from_person_id',
        'to_person_id',
        'type',
    ];

    protected $casts = [
        'from_person_id' => 'integer',
        'to_person_id' => 'integer',
    ];

    /** @return BelongsTo<Person, $this> */
    public function fromPerson(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'from_person_id');
    }

    /** @return BelongsTo<Person, $this> */
    public function toPerson(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'to_person_id');
    }
}
