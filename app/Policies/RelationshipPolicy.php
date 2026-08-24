<?php

declare(strict_types=1);

namespace App\Policies;

use App\Infrastructure\Persistence\Relationship;
use App\Models\User;

class RelationshipPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Relationship $relationship): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Relationship $relationship): bool
    {
        return true;
    }

    public function delete(User $user, Relationship $relationship): bool
    {
        return true;
    }
}
