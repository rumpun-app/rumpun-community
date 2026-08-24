<?php

declare(strict_types=1);

namespace App\Policies;

use App\Infrastructure\Persistence\Person;
use App\Models\User;

class PersonPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Person $person): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Person $person): bool
    {
        return true;
    }

    public function delete(User $user, Person $person): bool
    {
        return true;
    }
}
