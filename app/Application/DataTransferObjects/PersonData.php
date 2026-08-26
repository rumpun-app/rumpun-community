<?php

namespace App\Application\DataTransferObjects;

use App\Infrastructure\Persistence\Person;

readonly class PersonData
{
    public function __construct(
        public int $id,
        public ?string $givenName,
        public ?string $familyName,
        public ?string $middleName,
        public ?string $prefix,
        public ?string $suffix,
        public ?string $sex,
        public ?string $birthPlace,
        public string $createdAt,
        public string $updatedAt,
    ) {}

    public static function fromModel(Person $person): self
    {
        return new self(
            id: $person->id,
            givenName: $person->given_name,
            familyName: $person->family_name,
            middleName: $person->middle_name,
            prefix: $person->prefix,
            suffix: $person->suffix,
            sex: $person->sex,
            birthPlace: $person->birth_place,
            createdAt: $person->created_at->toIso8601String(),
            updatedAt: $person->updated_at->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'given_name' => $this->givenName,
            'family_name' => $this->familyName,
            'middle_name' => $this->middleName,
            'prefix' => $this->prefix,
            'suffix' => $this->suffix,
            'sex' => $this->sex,
            'birth_place' => $this->birthPlace,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
