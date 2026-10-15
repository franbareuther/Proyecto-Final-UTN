<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $app = parent::createApplication();
        // Antes de que RefreshDatabase pueda migrar, impedir cualquier DB persistente ajena a testing.
        $connection = config('database.default');
        // Resolve URL overrides as well, before any migration can execute.
        $database = DB::connection()->getDatabaseName();
        if (! $app->environment('testing') || ($connection === 'sqlite' && $database !== ':memory:') || ($connection !== 'sqlite' && ! str_ends_with((string) $database, '_testing'))) {
            throw new \RuntimeException('Testing requiere SQLite en memoria o una base exclusiva terminada en _testing, y APP_ENV=testing.');
        }

        return $app;
    }
}
