<?php

it('ensures Domain does not import Filament, Livewire, or Http', function (): void {
    $domainFiles = glob(__DIR__.'/../../../app/Domain/**/*.php');
    if ($domainFiles === false) {
        $domainFiles = [];
    }

    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(__DIR__.'/../../../app/Domain'));
    $violations = [];

    foreach ($iterator as $file) {
        if (! $file->isFile() || $file->getExtension() !== 'php') {
            continue;
        }
        $content = file_get_contents($file->getPathname());
        if ($content === false) {
            continue;
        }
        foreach (['use Filament', 'use Livewire', 'use App\\Http', 'use Illuminate\\Http'] as $needle) {
            if (str_contains($content, $needle)) {
                $violations[] = $file->getPathname()." contains '{$needle}'";
            }
        }
    }

    expect($violations)->toBeEmpty(implode("\n", $violations));
});
