<?php

namespace App\Domain\Enums;

enum DateType: string
{
    case Exact = 'exact';
    case Approximate = 'approximate';
    case Range = 'range';
    case TextOnly = 'text_only';
    case Unknown = 'unknown';

    public function requiresDateFrom(): bool
    {
        return in_array($this, [self::Exact, self::Approximate, self::Range], true);
    }

    public function requiresText(): bool
    {
        return $this === self::TextOnly;
    }
}
