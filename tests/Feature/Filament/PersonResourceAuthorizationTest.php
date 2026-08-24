<?php

use App\Filament\Resources\People\PersonResource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows authenticated user to access people resource pages', function (): void {
    $user = User::factory()->create();
    $this->actingAs($user);

    expect(PersonResource::canViewAny())->toBeTrue();
});

it('requires authentication for Filament admin panel', function (): void {
    $response = $this->get('/admin');
    $response->assertRedirect('/admin/login');
});

it('denies unauthenticated access to people list', function (): void {
    $response = $this->get('/admin/people');
    $response->assertRedirect('/admin/login');
});
