<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ContactMessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_contact_form_creates_a_message_visible_to_superadmin(): void
    {
        $data = ['name' => 'Ana', 'email' => 'ana@example.test', 'phone' => '+54 9 11 1234 5678', 'subject' => 'Consulta general', 'message' => 'Quiero conocer los requisitos para sumar un refugio.'];

        $this->post('/contacto', $data)->assertRedirect(route('home').'#contacto');
        $this->assertDatabaseHas('contact_messages', $data);

        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->get('/superadmin/mensajes')
            ->assertInertia(fn (Assert $page) => $page->component('Superadmin/Messages')
                ->where('messages.total', 1)
                ->where('messages.data.0.message', $data['message'])
                ->where('messages.data.0.phone', $data['phone'])
                ->where('messages.data.0.email', $data['email']));
    }

    public function test_only_superadmin_can_read_contact_messages(): void
    {
        $this->get('/superadmin/mensajes')->assertRedirect('/login');
        foreach (['admin', 'adoptante'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))
                ->get('/superadmin/mensajes')->assertForbidden();
        }
    }

    public function test_invalid_contact_form_does_not_create_a_message(): void
    {
        $this->post('/contacto', ['name' => '', 'email' => 'invalid', 'subject' => 'Otro', 'message' => 'corto'])
            ->assertSessionHasErrors(['name', 'email', 'phone', 'subject', 'message']);
        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_inbox_is_paginated_with_newest_messages_first(): void
    {
        foreach (range(1, 16) as $index) {
            DB::table('contact_messages')->insert([
                'name' => 'Ana', 'email' => 'ana@example.test', 'subject' => 'Consulta general',
                'message' => 'Consulta número '.$index, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->get('/superadmin/mensajes')->assertInertia(fn (Assert $page) => $page
            ->where('messages.total', 16)->has('messages.data', 15)
            ->where('messages.data.0.message', 'Consulta número 16'));
        $this->get('/superadmin/mensajes?page=2')->assertInertia(fn (Assert $page) => $page
            ->has('messages.data', 1)->where('messages.data.0.message', 'Consulta número 1'));
    }

    public function test_contact_requires_a_valid_phone_number(): void
    {
        foreach (['', 'abc1234567', '--- ---', '123', str_repeat('1', 16)] as $phone) {
            $this->post('/contacto', [
                'name' => 'Ana', 'email' => 'ana@example.test', 'phone' => $phone,
                'subject' => 'Consulta general', 'message' => 'Una consulta de prueba válida.',
            ])->assertSessionHasErrors('phone');
        }
        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_existing_messages_without_phone_remain_visible(): void
    {
        DB::table('contact_messages')->insert([
            'name' => 'Ana', 'email' => 'ana@example.test', 'subject' => 'Consulta general',
            'message' => 'Mensaje anterior al campo teléfono.', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->get('/superadmin/mensajes')->assertInertia(fn (Assert $page) => $page
            ->where('messages.total', 1)->where('messages.data.0.phone', null));
    }
}
