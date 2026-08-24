<?php

declare(strict_types=1);

namespace App\Application\People;

use App\Infrastructure\Persistence\Person;
use Illuminate\Support\Facades\DB;

final class CreatePerson
{
    public function execute(CreatePersonData $data): Person
    {
        return DB::transaction(function () use ($data): Person {
            return Person::create([
                'given_name' => $data->givenName,
                'family_name' => $data->familyName,
                'middle_name' => $data->middleName,
                'prefix' => $data->prefix,
                'suffix' => $data->suffix,
                'sex' => $data->sex,
                'birth_date' => $data->birthDate,
                'birth_place' => $data->birthPlace,
            ]);
        });
    }
}
