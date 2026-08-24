<?php

declare(strict_types=1);

namespace App\Filament\Resources\Relationships\Pages;

use App\Filament\Resources\Relationships\RelationshipResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListRelationships extends ListRecords
{
    protected static string $resource = RelationshipResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()];
    }
}
