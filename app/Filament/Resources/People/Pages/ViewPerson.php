<?php

declare(strict_types=1);

namespace App\Filament\Resources\People\Pages;

use App\Filament\Resources\People\PersonResource;
use Filament\Actions;
use Filament\Resources\Pages\ViewRecord;

class ViewPerson extends ViewRecord
{
    protected static string $resource = PersonResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\EditAction::make(),
        ];
    }
}
