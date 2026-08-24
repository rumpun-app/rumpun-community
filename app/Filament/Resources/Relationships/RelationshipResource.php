<?php

declare(strict_types=1);

namespace App\Filament\Resources\Relationships;

use App\Filament\Resources\Relationships\Pages\CreateRelationship as CreatePage;
use App\Filament\Resources\Relationships\Pages\EditRelationship;
use App\Filament\Resources\Relationships\Pages\ListRelationships;
use App\Infrastructure\Persistence\Person;
use App\Infrastructure\Persistence\Relationship;
use Filament\Forms\Components;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;

class RelationshipResource extends Resource
{
    protected static ?string $model = Relationship::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-link';

    protected static ?string $navigationLabel = 'Relationships';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Components\Select::make('from_person_id')
                    ->label('From')
                    ->options(fn () => Person::all()->pluck('given_name', 'id'))
                    ->getOptionLabelFromRecordUsing(fn (Person $r) => $r->displayName())
                    ->searchable()
                    ->required(),
                Components\Select::make('to_person_id')
                    ->label('To')
                    ->options(fn () => Person::all()->pluck('given_name', 'id'))
                    ->getOptionLabelFromRecordUsing(fn (Person $r) => $r->displayName())
                    ->searchable()
                    ->required(),
                Components\Select::make('type')
                    ->options([
                        'parent_child' => 'Parent–Child',
                        'partnership' => 'Partnership',
                        'sibling' => 'Sibling',
                    ])
                    ->required(),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('fromPerson.display_name')->label('From')->state(fn (Relationship $r) => $r->fromPerson->displayName()),
                Tables\Columns\TextColumn::make('toPerson.display_name')->label('To')->state(fn (Relationship $r) => $r->toPerson->displayName()),
                Tables\Columns\TextColumn::make('type')->badge(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListRelationships::route('/'),
            'create' => CreatePage::route('/create'),
            'edit' => EditRelationship::route('/{record}/edit'),
        ];
    }
}
