<?php

namespace App\Domain\Enums;

enum RelationshipType: string
{
    case Biological = 'biological';
    case Adoptive = 'adoptive';
    case Foster = 'foster';
    case Guardian = 'guardian';
    case Spouse = 'spouse';
    case Partner = 'partner';

    public function isParental(): bool
    {
        return in_array($this, [self::Biological, self::Adoptive, self::Foster, self::Guardian], true);
    }

    public function isPartnership(): bool
    {
        return in_array($this, [self::Spouse, self::Partner], true);
    }

    public static function parentalValues(): array
    {
        return array_values(array_map(
            fn (self $t) => $t->value,
            array_filter(self::cases(), fn (self $t) => $t->isParental()),
        ));
    }

    public static function partnershipValues(): array
    {
        return array_values(array_map(
            fn (self $t) => $t->value,
            array_filter(self::cases(), fn (self $t) => $t->isPartnership()),
        ));
    }
}
