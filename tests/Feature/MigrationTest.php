<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

it('runs all migrations and has expected tables', function (): void {
    expect(Schema::hasTable('users'))->toBeTrue();
    expect(Schema::hasTable('people'))->toBeTrue();
    expect(Schema::hasTable('relationships'))->toBeTrue();
    expect(Schema::hasTable('sessions'))->toBeTrue();
    expect(Schema::hasTable('jobs'))->toBeTrue();
});

it('supports backup and restore semantics via transaction', function (): void {
    DB::table('people')->insert(['given_name' => 'Test', 'family_name' => 'User', 'created_at' => now(), 'updated_at' => now()]);
    expect(DB::table('people')->count())->toBe(1);

    DB::beginTransaction();
    DB::table('people')->insert(['given_name' => 'Temp', 'family_name' => 'User', 'created_at' => now(), 'updated_at' => now()]);
    expect(DB::table('people')->count())->toBe(2);
    DB::rollBack();
    expect(DB::table('people')->count())->toBe(1);
});
