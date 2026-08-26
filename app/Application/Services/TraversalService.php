<?php

namespace App\Application\Services;

use App\Domain\Contracts\PersonRepositoryInterface;

class TraversalService
{
    public function __construct(private readonly PersonRepositoryInterface $people) {}

    public function ancestors(int $personId, int $maxDepth = 10): array
    {
        return $this->people->ancestors($personId, $this->clampDepth($maxDepth));
    }

    public function descendants(int $personId, int $maxDepth = 10): array
    {
        return $this->people->descendants($personId, $this->clampDepth($maxDepth));
    }

    private function clampDepth(int $depth): int
    {
        return max(1, min($depth, 20));
    }
}
