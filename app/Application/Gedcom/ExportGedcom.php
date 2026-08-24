<?php

declare(strict_types=1);

namespace App\Application\Gedcom;

use App\Domain\Gedcom\GedcomExporter;
use App\Infrastructure\Persistence\Person;
use App\Infrastructure\Persistence\Relationship;

final class ExportGedcom
{
    public function __construct(private readonly GedcomExporter $exporter) {}

    public function execute(): string
    {
        $people = Person::all()->map(fn (Person $p) => [
            'id' => 'I'.$p->id,
            'given_name' => $p->given_name,
            'family_name' => $p->family_name,
            'sex' => $p->sex,
        ])->all();

        $relationships = Relationship::all()->map(fn (Relationship $r) => [
            'type' => $r->type,
            'from' => 'I'.$r->from_person_id,
            'to' => 'I'.$r->to_person_id,
        ])->all();

        return $this->exporter->export($people, $relationships);
    }
}
