<?php

declare(strict_types=1);

namespace App\Application\People;

final readonly class CreatePersonData
{
    public function __construct(
        public string $givenName,
        public string $familyName,
        public ?string $middleName = null,
        public ?string $prefix = null,
        public ?string $suffix = null,
        public ?string $sex = null,
        public ?string $birthDate = null,
        public ?string $birthPlace = null,
    ) {}
}
