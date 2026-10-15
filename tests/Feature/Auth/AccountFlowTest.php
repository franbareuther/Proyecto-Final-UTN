<?php

namespace Tests\Feature\Auth;

use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AccountFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_and_profile_ignore_forged_role_and_shelter(): void
    {
        $shelter = Shelter::firstOrFail();
        $this->post('/register', ['name' => 'Ana', 'last_name' => 'Demo', 'email' => 'ana@example.test', 'password' => 'example-password', 'password_confirmation' => 'example-password', 'role' => 'superadmin', 'shelter_id' => $shelter->id])->assertSessionHasNoErrors();
        $user = User::where('email', 'ana@example.test')->firstOrFail();
        $this->assertSame('adoptante', $user->role);
        $this->assertNull($user->shelter_id);
        $this->patch('/profile', ['name' => 'Ana', 'last_name' => 'Nueva', 'email' => $user->email, 'role' => 'admin', 'shelter_id' => $shelter->id])->assertSessionHasNoErrors();
        $this->assertSame('adoptante', $user->fresh()->role);
        $this->assertNull($user->fresh()->shelter_id);
    }

    public function test_each_role_reaches_its_dashboard_and_logout_invalidates_authentication(): void
    {
        foreach (['superadmin' => '/superadmin/refugios', 'admin' => '/admin', 'adoptante' => '/mis-solicitudes'] as $role => $target) {
            session()->forget('url.intended');
            $user = User::factory()->create(['role' => $role]);
            $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect('/dashboard');
            $this->get('/dashboard')->assertRedirect($target);
            $this->post('/logout')->assertRedirect('/');
            $this->assertGuest();
            $this->get('/profile')->assertRedirect('/login');
        }
    }

    public function test_intended_legacy_application_link_survives_login_and_unavailability(): void
    {
        $user = User::factory()->create();
        $animal = Animal::factory()->create();
        $path = '/animales/'.$animal->id.'/solicitar';
        $this->get($path)->assertRedirect('/login');
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect($path);
        $animal->update(['availability_status' => 'Adoptado']);
        $this->get($path)->assertRedirect('/animales/'.$animal->id)->assertSessionHas('error');
    }

    public function test_authentication_validation_and_password_confirmation_are_spanish(): void
    {
        $this->from('/register')->post('/register', [])->assertSessionHasErrors(['name', 'last_name', 'email', 'password']);
        $this->assertStringContainsString('Completá', session('errors')->first('last_name'));
        $user = User::factory()->create();
        $this->post('/login', ['email' => $user->email, 'password' => 'wrong'])->assertSessionHasErrors('email');
        $this->assertSame('El correo o la contraseña no son correctos.', session('errors')->first('email'));
        $this->actingAs($user)->post('/confirm-password', ['password' => 'wrong'])->assertSessionHasErrors('password');
        $this->assertSame('La contraseña no es correcta.', session('errors')->first('password'));
        $this->post('/confirm-password', ['password' => 'password'])->assertSessionHasNoErrors()->assertSessionHas('auth.password_confirmed_at');
        $this->put('/password', ['current_password' => 'wrong', 'password' => 'new-password', 'password_confirmation' => 'new-password'])->assertSessionHasErrors('current_password');
        $this->put('/password', ['current_password' => 'password', 'password' => 'new-password', 'password_confirmation' => 'new-password'])->assertSessionHasNoErrors();
        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }

    public function test_reset_mail_has_spanish_content_and_a_single_use_token(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $this->post('/forgot-password', ['email' => $user->email])->assertSessionHasNoErrors()->assertSessionHas('status');
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $message = $notification->toMail($user);
            $this->assertSame('Recuperá tu contraseña de Huella', $message->subject);
            $this->assertStringContainsString($notification->token, $message->actionUrl);
            $this->assertSame('Elegir una nueva contraseña', $message->actionText);
            $payload = ['token' => $notification->token, 'email' => $user->email, 'password' => 'restored-password', 'password_confirmation' => 'restored-password'];
            $this->post('/reset-password', $payload)->assertRedirect('/login')->assertSessionHasNoErrors();
            $this->assertTrue(Hash::check('restored-password', $user->fresh()->password));
            $this->post('/reset-password', $payload)->assertSessionHasErrors('email');
            $this->assertStringContainsString('no es válido', session('errors')->first('email'));

            return true;
        });
    }

    public function test_unknown_email_has_same_recovery_message_and_expired_tokens_fail(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $this->post('/forgot-password', ['email' => $user->email]);
        $known = session('status');
        $this->post('/forgot-password', ['email' => 'unknown@example.test'])->assertSessionHasNoErrors()->assertSessionHas('status', $known);
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            DB::table('password_reset_tokens')->where('email', $user->email)->update(['created_at' => now()->subMinutes(61)]);
            $this->post('/reset-password', ['token' => $notification->token, 'email' => $user->email, 'password' => 'new-password', 'password_confirmation' => 'new-password'])->assertSessionHasErrors('email');
            $this->assertTrue(Hash::check('password', $user->fresh()->password));

            return true;
        });
    }

    public function test_malformed_confirmation_and_reset_fields_return_validation_instead_of_errors(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post('/confirm-password', ['password' => ['unexpected']])->assertSessionHasErrors('password');
        $this->post('/logout');
        $this->post('/reset-password', ['token' => ['unexpected'], 'email' => $user->email, 'password' => 'new-password', 'password_confirmation' => 'new-password'])->assertSessionHasErrors('token');
    }

    public function test_repeated_login_attempts_are_limited_with_a_spanish_error(): void
    {
        $user = User::factory()->create();
        for ($i = 0; $i < 6; $i++) {
            $this->post('/login', ['email' => $user->email, 'password' => 'wrong'])->assertSessionHasErrors('email');
        }
        $this->assertStringContainsString('Demasiados intentos', session('errors')->first('email'));
        $this->assertGuest();
    }
}
