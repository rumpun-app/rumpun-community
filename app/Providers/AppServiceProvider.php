<?php

namespace App\Providers;

use App\Domain\Contracts\PersonRepositoryInterface;
use App\Domain\Contracts\RelationshipRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentPersonRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentRelationshipRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PersonRepositoryInterface::class, EloquentPersonRepository::class);
        $this->app->bind(RelationshipRepositoryInterface::class, EloquentRelationshipRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
