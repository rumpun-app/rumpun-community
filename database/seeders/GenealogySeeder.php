<?php

namespace Database\Seeders;

use App\Domain\Enums\FactType;
use App\Domain\Enums\RelationshipType;
use App\Infrastructure\Persistence\Eloquent\Models\Citation;
use App\Infrastructure\Persistence\Eloquent\Models\Fact;
use App\Infrastructure\Persistence\Eloquent\Models\Place;
use App\Infrastructure\Persistence\Eloquent\Models\Source;
use App\Infrastructure\Persistence\Person;
use App\Infrastructure\Persistence\Relationship;
use Illuminate\Database\Seeder;

class GenealogySeeder extends Seeder
{
    public function run(): void
    {
        $place = Place::factory()->create(['name' => 'Samarinda, Kalimantan Timur']);
        $source = Source::factory()->create(['title' => 'Synthetic Family Records — Samarinda']);

        $grandparent = Person::factory()->create(['given_name' => 'Siti', 'family_name' => 'Rahayu']);
        $parent = Person::factory()->create(['given_name' => 'Budi', 'family_name' => 'Rahayu']);
        $child = Person::factory()->create(['given_name' => 'Ari', 'family_name' => 'Rahayu']);
        $partner = Person::factory()->create(['given_name' => 'Dewi', 'family_name' => 'Lestari']);

        Relationship::factory()->create([
            'from_person_id' => $parent->id,
            'to_person_id' => $grandparent->id,
            'type' => RelationshipType::Biological->value,
        ]);

        Relationship::factory()->create([
            'from_person_id' => $child->id,
            'to_person_id' => $parent->id,
            'type' => RelationshipType::Biological->value,
        ]);

        Relationship::factory()->create([
            'from_person_id' => $parent->id,
            'to_person_id' => $partner->id,
            'type' => RelationshipType::Spouse->value,
        ]);

        $fact = Fact::factory()->create([
            'person_id' => $child->id,
            'type' => FactType::Birth->value,
            'place_id' => $place->id,
        ]);

        $citation = Citation::factory()->create(['source_id' => $source->id]);
        $fact->citations()->attach($citation->id);
    }
}
