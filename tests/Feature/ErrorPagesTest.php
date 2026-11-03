<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ErrorPagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Route::middleware('web')->group(function () {
            Route::get('/_prueba/servidor', fn () => throw new \RuntimeException('Fallo de prueba'));
            Route::get('/_prueba/mantenimiento', fn () => abort(503));
            Route::post('/_prueba/expirada', fn () => throw new TokenMismatchException);
        });
    }

    public function test_missing_and_forbidden_pages_use_the_branded_error_page(): void
    {
        $this->get('/esta-pagina-no-existe')->assertNotFound()->assertInertia(fn (Assert $page) => $page
            ->component('Errors/Error')->where('status', 404)->where('shelterName', 'Huellita')->where('auth.user', null));
        $this->get('/refugios/refugio-inexistente')->assertNotFound()->assertInertia(fn (Assert $page) => $page->where('status', 404));

        $adopter = User::factory()->create(['role' => 'adoptante']);
        $this->actingAs($adopter)->get('/admin')->assertForbidden()->assertInertia(fn (Assert $page) => $page
            ->component('Errors/Error')->where('status', 403)->where('auth.user.id', $adopter->id));
    }

    public function test_server_errors_keep_technical_detail_only_while_debugging(): void
    {
        config(['app.debug' => false]);
        $this->get('/_prueba/servidor')->assertStatus(500)->assertInertia(fn (Assert $page) => $page->component('Errors/Error')->where('status', 500));
        $this->get('/_prueba/mantenimiento')->assertStatus(503)->assertInertia(fn (Assert $page) => $page->where('status', 503));

        config(['app.debug' => true]);
        // La pantalla de depuración de Laravel no es una página de la aplicación.
        $this->assertStringNotContainsString('id="app" data-page', $this->get('/_prueba/servidor')->assertStatus(500)->getContent());
    }

    public function test_expired_forms_return_with_a_message_and_json_keeps_its_format(): void
    {
        $this->from('/animales')->post('/_prueba/expirada')->assertRedirect('/animales')->assertSessionHas('error');

        $this->getJson('/esta-pagina-no-existe')->assertNotFound()->assertJsonStructure(['message']);
        $this->actingAs(User::factory()->create(['role' => 'adoptante']))->getJson('/chats/999999')->assertNotFound()->assertJsonStructure(['message']);
    }
}
