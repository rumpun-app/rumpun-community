<?php

declare(strict_types=1);

namespace App\Domain\People;

final readonly class PersonName
{
    public function __construct(
        public string $givenName,
        public string $familyName,
        public ?string $middleName = null,
        public ?string $prefix = null,
        public ?string $suffix = null,
    ) {
        if (trim($this->givenName) === '' && trim($this->familyName) === '') {
            throw new \InvalidArgumentException('At least givenName or familyName must be non-empty.');
        }
    }

    public function displayName(): string
    {
        $parts = array_filter([
            $this->prefix,
            $this->givenName,
            $this->middleName,
            $this->familyName,
            $this->suffix,
        ], fn (?string $v) => $v !== null && trim($v) !== '');

        return implode(' ', $parts);
    }

    public function toArray(): array
    {
        return [
            'given_name' => $this->givenName,
            'family_name' => $this->familyName,
            'middle_name' => $this->middleName,
            'prefix' => $this->prefix,
            'suffix' => $this->suffix,
        ];
    }
}
