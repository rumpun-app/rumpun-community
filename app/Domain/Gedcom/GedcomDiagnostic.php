<?php

declare(strict_types=1);

namespace App\Domain\Gedcom;

final readonly class GedcomDiagnostic
{
    public function __construct(
        public string $level,
        public string $code,
        public string $message,
        public ?int $line = null,
    ) {}

    public function toArray(): array
    {
        return [
            'level' => $this->level,
            'code' => $this->code,
            'message' => $this->message,
            'line' => $this->line,
        ];
    }
}
