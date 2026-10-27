<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_register_a_contact_message(): void
    {
        $data = ['name' => 'Ana', 'email' => 'ana@example.test', 'subject' => 'Sumar mi refugio', 'message' => 'Quiero conocer cómo sumar nuestro refugio a la red.'];

        $this->post('/contacto', $data)->assertRedirect(route('home').'#contacto');
        $this->assertDatabaseHas('contact_messages', $data);
    }

    public function test_invalid_contact_is_rejected_without_storing_it(): void
    {
        $this->post('/contacto', ['name' => '', 'email' => 'invalid', 'subject' => 'Unknown', 'message' => 'short'])
            ->assertSessionHasErrors(['name', 'email', 'subject', 'message']);

        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_contact_submissions_are_rate_limited(): void
    {
        $data = ['name' => 'Ana', 'email' => 'ana@example.test', 'subject' => 'Consulta general', 'message' => 'Tengo una consulta sobre la plataforma.'];
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->post('/contacto', $data)->assertRedirect();
        }

        $this->post('/contacto', $data)->assertStatus(429);
        $this->assertDatabaseCount('contact_messages', 5);
    }
}
