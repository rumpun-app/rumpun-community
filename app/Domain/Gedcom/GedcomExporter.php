<?php

declare(strict_types=1);

namespace App\Domain\Gedcom;

final class GedcomExporter
{
    /**
     * Build a minimal GEDCOM 5.5.1 text from synthetic person/relationship arrays.
     *
     * @param  array<int, array{id: string, given_name: string, family_name: string, sex?: string}>  $people
     * @param  array<int, array{type: string, from: string, to: string}>  $relationships
     */
    public function export(array $people, array $relationships = []): string
    {
        $lines = [];
        $lines[] = '0 HEAD';
        $lines[] = '1 SOUR RumpunCommunity';
        $lines[] = '1 GEDC';
        $lines[] = '2 VERS 5.5.1';
        $lines[] = '2 FORM LINEAGE-LINKED';
        $lines[] = '1 CHAR UTF-8';

        foreach ($people as $p) {
            $id = $p['id'];
            $lines[] = "0 @{$id}@ INDI";
            $given = $p['given_name'] ?? '';
            $family = $p['family_name'] ?? '';
            $lines[] = "1 NAME {$given} /{$family}/";
            if (isset($p['sex']) && $p['sex'] !== '') {
                $lines[] = '1 SEX '.strtoupper(substr($p['sex'], 0, 1));
            }
        }

        foreach ($relationships as $rel) {
            $lines[] = "0 @FAM{$rel['from']}_{$rel['to']}@ FAM";
            $lines[] = "1 HUSB @{$rel['from']}@";
            $lines[] = "1 WIFE @{$rel['to']}@";
        }

        $lines[] = '0 TRLR';

        return implode("\n", $lines)."\n";
    }
}
