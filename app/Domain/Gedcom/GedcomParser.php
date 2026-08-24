<?php

declare(strict_types=1);

namespace App\Domain\Gedcom;

final class GedcomParser
{
    /**
     * Parse GEDCOM text into structured records, collecting diagnostics.
     * Never throws on malformed input — diagnostics before commit.
     *
     * @return array{records: array<int, array{level: int, tag: string, value: string, xref: ?string}>, diagnostics: GedcomDiagnostic[]}
     */
    public function parse(string $gedcomText): array
    {
        $diagnostics = [];
        $records = [];
        $lines = preg_split('/\r\n|\r|\n/', $gedcomText);

        if ($lines === false) {
            $diagnostics[] = new GedcomDiagnostic('error', 'gedcom.empty', 'GEDCOM text could not be split into lines.');

            return ['records' => [], 'diagnostics' => $diagnostics];
        }

        foreach ($lines as $idx => $rawLine) {
            $lineNo = $idx + 1;
            $line = trim($rawLine);

            if ($line === '') {
                continue;
            }

            if (! preg_match('/^(\d+)\s+(?:(@[^@]+@)\s+)?([A-Za-z0-9_]+)\s*(.*)$/', $line, $m)) {
                $diagnostics[] = new GedcomDiagnostic('warning', 'gedcom.malformed_line', "Malformed GEDCOM line: {$line}", $lineNo);

                continue;
            }

            $level = (int) $m[1];
            $xref = isset($m[2]) && $m[2] !== '' ? $m[2] : null;
            $tag = strtoupper($m[3]);
            $value = trim($m[4] ?? '');

            $records[] = [
                'level' => $level,
                'tag' => $tag,
                'value' => $value,
                'xref' => $xref,
                'line' => $lineNo,
            ];
        }

        if ($records === []) {
            $diagnostics[] = new GedcomDiagnostic('warning', 'gedcom.no_records', 'No GEDCOM records found.');
        }

        $hasHeader = false;
        $hasTrailer = false;
        foreach ($records as $r) {
            if ($r['level'] === 0 && $r['tag'] === 'HEAD') {
                $hasHeader = true;
            }
            if ($r['level'] === 0 && $r['tag'] === 'TRLR') {
                $hasTrailer = true;
            }
        }

        if (! $hasHeader) {
            $diagnostics[] = new GedcomDiagnostic('warning', 'gedcom.missing_head', 'GEDCOM HEAD record not found.');
        }
        if (! $hasTrailer) {
            $diagnostics[] = new GedcomDiagnostic('warning', 'gedcom.missing_trlr', 'GEDCOM TRLR record not found.');
        }

        return ['records' => $records, 'diagnostics' => $diagnostics];
    }
}
