<?php

namespace App\Application\UseCases;

use App\Application\DataTransferObjects\PersonData;
use App\Domain\Contracts\PersonRepositoryInterface;
use Illuminate\Support\Facades\DB;

class CreatePerson
{
    public function __construct(private readonly PersonRepositoryInterface $people) {}

    public function execute(array $attributes): PersonData
    {
        $person = DB::transaction(fn () => $this->people->create($attributes));

        return PersonData::fromModel($person);
    }
}
