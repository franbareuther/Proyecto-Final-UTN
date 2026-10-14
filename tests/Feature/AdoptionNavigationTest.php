<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdoptionNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unavailable_application_links_return_to_profile_with_explanation(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'adoptante']));

        foreach (['Adoptado', 'En proceso de adopción', 'No disponible temporalmente'] as $status) {
            $animal = Animal::factory()->create(['availability_status' => $status]);
            $this->get('/animales/'.$animal->id.'/solicitar')
                ->assertRedirect('/animales/'.$animal->id)
                ->assertSessionHas('error', 'Este animal ya no recibe nuevas solicitudes. Podés consultar su estado en el perfil.');

            $this->get('/animales/'.$animal->id)->assertInertia(fn (Assert $page) => $page
                ->component('Public/Animal')
                ->where('flash.error', 'Este animal ya no recibe nuevas solicitudes. Podés consultar su estado en el perfil.'));
        }

        $this->assertDatabaseCount('adoption_requests', 0);
    }

    public function test_available_application_still_opens_and_preserves_role_restrictions(): void
    {
        $animal = Animal::factory()->create();
        $this->get('/animales/'.$animal->id.'/solicitar')->assertRedirect('/login');
        $this->actingAs(User::factory()->create(['role' => 'adoptante']))->get('/animales/'.$animal->id.'/solicitar')
            ->assertInertia(fn (Assert $page) => $page->component('Adoptante/Apply')->where('animal.id', $animal->id));

        foreach (['admin', 'veterinario'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))
                ->get('/animales/'.$animal->id.'/solicitar')->assertForbidden();
        }
    }
}
