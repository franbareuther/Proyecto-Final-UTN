<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SpanishMessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_errors_and_generic_validation_are_in_spanish(): void
    {
        $this->assertSame('es', app()->getLocale());
        $user = User::factory()->create(['email' => 'ana@huella.test']);

        $this->post('/login', ['email' => $user->email, 'password' => 'incorrecta'])
            ->assertSessionHasErrors(['email' => 'El correo o la contraseña no son correctos.']);
        $this->post('/login', ['email' => '', 'password' => ''])
            ->assertSessionHasErrors(['email' => 'Completá el campo correo electrónico.', 'password' => 'Completá el campo contraseña.']);

        foreach (range(1, 5) as $attempt) {
            $this->post('/login', ['email' => $user->email, 'password' => 'incorrecta']);
        }
        $this->post('/login', ['email' => $user->email, 'password' => 'incorrecta'])->assertSessionHasErrors('email');
        $this->assertStringStartsWith('Demasiados intentos de ingreso.', session('errors')->first('email'));
    }

    public function test_password_recovery_messages_and_email_are_in_spanish(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'ana@huella.test']);

        $this->post('/forgot-password', ['email' => 'nadie@huella.test'])
            ->assertSessionHasErrors(['email' => 'No encontramos una cuenta con ese correo electrónico.']);
        $this->post('/forgot-password', ['email' => $user->email])
            ->assertSessionHas('status', 'Te enviamos un correo con el enlace para restablecer tu contraseña.');

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user) {
            $mail = $notification->toMail($user);

            return $mail->subject === 'Restablecer tu contraseña' && $mail->actionText === 'Restablecer contraseña'
                && in_array('Este enlace vence en 60 minutos.', $mail->outroLines, true);
        });

        $this->post('/reset-password', ['token' => 'vencido', 'email' => $user->email, 'password' => 'una-clave-nueva', 'password_confirmation' => 'una-clave-nueva'])
            ->assertSessionHasErrors(['email' => 'El enlace para restablecer la contraseña no es válido o ya venció. Pedí uno nuevo.']);
    }
}
