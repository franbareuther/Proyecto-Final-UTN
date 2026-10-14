<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $app = parent::createApplication();
        // Antes de que RefreshDatabase pueda migrar, impedir cualquier DB persistente ajena a testing.
        $connection = config('database.default');
        $database = config("database.connections.$connection.database");
        if ($connection !== 'sqlite' && ! str_ends_with((string) $database, '_testing')) {
            throw new \RuntimeException('Las pruebas solo permiten bases persistentes terminadas en _testing.');
        }

        return $app;
    }
}
