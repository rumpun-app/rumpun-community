<?php

namespace App\Domain\ValueObjects;

use App\Domain\Enums\DateType;

readonly class GenealogicalDate
{
    public function __construct(
        public ?DateType $type = null,
        public ?string $dateFrom = null,
        public ?string $dateTo = null,
        public ?string $text = null,
        public bool $isApproximate = false,
        public bool $isDisputed = false,
        public ?string $originalValue = null,
    ) {}

    public static function unknown(?string $originalValue = null): self
    {
        return new self(type: DateType::Unknown, originalValue: $originalValue);
    }

    public static function textOnly(string $text, ?string $originalValue = null): self
    {
        return new self(type: DateType::TextOnly, text: $text, originalValue: $originalValue);
    }

    public static function exact(string $date, ?string $originalValue = null): self
    {
        return new self(type: DateType::Exact, dateFrom: $date, originalValue: $originalValue);
    }

    public static function approximate(string $date, ?string $originalValue = null): self
    {
        return new self(type: DateType::Approximate, dateFrom: $date, isApproximate: true, originalValue: $originalValue);
    }

    public static function range(string $from, string $to, ?string $originalValue = null): self
    {
        return new self(type: DateType::Range, dateFrom: $from, dateTo: $to, originalValue: $originalValue);
    }

    public function toArray(): array
    {
        return [
            'date_type' => $this->type?->value,
            'date_from' => $this->dateFrom,
            'date_to' => $this->dateTo,
            'date_text' => $this->text,
            'date_is_approximate' => $this->isApproximate,
            'is_disputed' => $this->isDisputed,
            'original_value' => $this->originalValue,
        ];
    }

    public function isUnknown(): bool
    {
        return $this->type === DateType::Unknown;
    }
}
