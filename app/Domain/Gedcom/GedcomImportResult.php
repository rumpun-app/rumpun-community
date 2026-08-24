<?php

declare(strict_types=1);

namespace App\Domain\Gedcom;

final readonly class GedcomImportResult
{
    /** @param GedcomDiagnostic[] $diagnostics */
    public function __construct(
        public bool $committed,
        public int $peopleImported,
        public int $relationshipsImported,
        public array $diagnostics = [],
    ) {}

    public function hasErrors(): bool
    {
        foreach ($this->diagnostics as $d) {
            if ($d->level === 'error') {
                return true;
            }
        }

        return false;
    }

    public function toArray(): array
    {
        return [
            'committed' => $this->committed,
            'people_imported' => $this->peopleImported,
            'relationships_imported' => $this->relationshipsImported,
            'diagnostics' => array_map(fn (GedcomDiagnostic $d) => $d->toArray(), $this->diagnostics),
        ];
    }
}
