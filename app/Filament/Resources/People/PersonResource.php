<?php

declare(strict_types=1);

namespace App\Filament\Resources\People;

use App\Filament\Resources\People\Pages\CreatePerson as CreatePersonPage;
use App\Filament\Resources\People\Pages\EditPerson;
use App\Filament\Resources\People\Pages\ListPeople;
use App\Filament\Resources\People\Pages\ViewPerson;
use App\Infrastructure\Persistence\Person;
use Filament\Forms\Components;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;

class PersonResource extends Resource
{
    protected static ?string $model = Person::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationLabel = 'People';

    protected static ?string $modelLabel = 'Person';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Components\TextInput::make('given_name')->required()->maxLength(255),
                Components\TextInput::make('family_name')->required()->maxLength(255),
                Components\TextInput::make('middle_name')->maxLength(255),
                Components\Select::make('sex')->options(['M' => 'Male', 'F' => 'Female'])->nullable(),
                Components\DatePicker::make('birth_date')->nullable(),
                Components\TextInput::make('birth_place')->maxLength(255),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('given_name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('family_name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('sex')->label('Sex'),
                Tables\Columns\TextColumn::make('birth_date')->date()->sortable(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\DeleteBulkAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListPeople::route('/'),
            'create' => CreatePersonPage::route('/create'),
            'view' => ViewPerson::route('/{record}'),
            'edit' => EditPerson::route('/{record}/edit'),
        ];
    }
}
