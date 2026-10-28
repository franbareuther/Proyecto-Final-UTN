<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'last_name' => 'Prueba',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_registration_opens_requests_with_the_new_user_logged_in(): void
    {
        $this->followingRedirects()->post('/register', [
            'name' => 'Ana',
            'last_name' => 'Prueba',
            'email' => 'ana@example.test',
            'password' => 'password-test-123',
            'password_confirmation' => 'password-test-123',
        ])->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Adoptante/Requests')
            ->where('auth.user.email', 'ana@example.test')
            ->where('auth.user.role', 'adoptante'));
    }

    public function test_registration_accepts_and_normalizes_uppercase_email(): void
    {
        $this->post('/register', [
            'name' => 'Ana', 'last_name' => 'Prueba', 'email' => 'Ana@Example.Test',
            'password' => 'password-test-123', 'password_confirmation' => 'password-test-123',
        ])->assertSessionHasNoErrors()->assertRedirect('/dashboard');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'ana@example.test', 'role' => 'adoptante']);
    }

    public function test_duplicate_email_shows_a_clear_error_without_creating_another_account(): void
    {
        User::factory()->create(['email' => 'ana@example.test']);

        $this->post('/register', [
            'name' => 'Ana', 'last_name' => 'Prueba', 'email' => 'ANA@example.test',
            'password' => 'password-test-123', 'password_confirmation' => 'password-test-123',
        ])->assertSessionHasErrors(['email' => 'Ya existe una cuenta con ese correo. Ingresá con tu contraseña o recuperala desde Ingresar.']);

        $this->assertGuest();
        $this->assertDatabaseCount('users', 1);
    }
}
