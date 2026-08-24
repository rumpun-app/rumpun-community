<?php

declare(strict_types=1);

namespace App\Application\Gedcom;

use App\Domain\Gedcom\GedcomDiagnostic;
use App\Domain\Gedcom\GedcomImportResult;
use App\Domain\Gedcom\GedcomParser;
use App\Infrastructure\Persistence\Person;
use Illuminate\Support\Facades\DB;

final class ImportGedcom
{
    public function __construct(private readonly GedcomParser $parser) {}

    public function execute(string $gedcomText, bool $dryRun = true): GedcomImportResult
    {
        $parsed = $this->parser->parse($gedcomText);
        $diagnostics = $parsed['diagnostics'];
        $records = $parsed['records'];

        $indiRecords = array_filter($records, fn (array $r) => $r['tag'] === 'INDI');

        if ($indiRecords === [] && $gedcomText !== '') {
            $diagnostics[] = new GedcomDiagnostic('warning', 'gedcom.no_individuals', 'No individuals (INDI) found in GEDCOM.');
        }

        if ($dryRun) {
            return new GedcomImportResult(
                committed: false,
                peopleImported: count($indiRecords),
                relationshipsImported: 0,
                diagnostics: $diagnostics,
            );
        }

        $hasError = false;
        foreach ($diagnostics as $d) {
            if ($d->level === 'error') {
                $hasError = true;
                break;
            }
        }

        if ($hasError) {
            return new GedcomImportResult(false, 0, 0, $diagnostics);
        }

        $count = 0;
        DB::transaction(function () use ($indiRecords, &$count): void {
            foreach ($indiRecords as $r) {
                $value = $r['value'] ?? '';
                $parts = explode('/', $value);
                $given = trim($parts[0] ?? 'Unknown');
                $family = trim($parts[1] ?? '');

                Person::create([
                    'given_name' => $given !== '' ? $given : 'Unknown',
                    'family_name' => $family !== '' ? $family : 'Unknown',
                ]);
                $count++;
            }
        });

        return new GedcomImportResult(true, $count, 0, $diagnostics);
    }
}
