<?php

declare(strict_types=1);

namespace App\Domain\Relationships;

enum RelationshipType: string
{
    case ParentChild = 'parent_child';
    case Partnership = 'partnership';
    case Sibling = 'sibling';

    public function label(): string
    {
        return match ($this) {
            self::ParentChild => 'Parent–Child',
            self::Partnership => 'Partnership',
            self::Sibling => 'Sibling',
        };
    }
}
