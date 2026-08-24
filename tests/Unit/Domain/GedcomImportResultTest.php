<?php

use App\Domain\Gedcom\GedcomDiagnostic;
use App\Domain\Gedcom\GedcomImportResult;

it('reports hasErrors correctly', function (): void {
    $ok = new GedcomImportResult(true, 2, 0, []);
    expect($ok->hasErrors())->toBeFalse();

    $withError = new GedcomImportResult(false, 0, 0, [
        new GedcomDiagnostic('error', 'gedcom.test', 'fail'),
    ]);
    expect($withError->hasErrors())->toBeTrue();

    $withWarning = new GedcomImportResult(true, 1, 0, [
        new GedcomDiagnostic('warning', 'gedcom.test', 'warn'),
    ]);
    expect($withWarning->hasErrors())->toBeFalse();
});

it('serializes to array', function (): void {
    $result = new GedcomImportResult(true, 1, 0, [
        new GedcomDiagnostic('warning', 'gedcom.missing_head', 'missing', 1),
    ]);

    $arr = $result->toArray();
    expect($arr['committed'])->toBeTrue();
    expect($arr['people_imported'])->toBe(1);
    expect($arr['diagnostics'][0]['code'])->toBe('gedcom.missing_head');
});
