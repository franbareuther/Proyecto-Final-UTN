<?php

namespace Tests\Feature;

use App\Models\AdoptionMessage;
use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use App\Services\AdoptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdoptionChatTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $adopter;

    private Animal $animal;

    private AdoptionRequest $application;

    protected function setUp(): void
    {
        parent::setUp();
        $shelter = Shelter::create(['name' => 'Patitas', 'slug' => 'patitas', 'active' => true]);
        $this->admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $this->adopter = User::factory()->create(['role' => 'adoptante']);
        $this->animal = Animal::factory()->create(['shelter_id' => $shelter->id, 'name' => 'Mora']);
        $this->application = app(AdoptionService::class)->submit($this->animal, $this->adopter, ['phone' => '1155551234', 'address' => 'Calle 123', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Experiencia previa.', 'motivation' => 'Un hogar responsable y permanente.']);
    }

    private function say(User $user, string $body = 'Hola')
    {
        return $this->actingAs($user)->postJson("/chats/{$this->application->id}/mensajes", ['body' => $body]);
    }

    public function test_only_the_adopter_and_the_responsible_shelter_can_chat(): void
    {
        $this->say($this->adopter, 'Hola, quiero conocer a Mora')->assertOk();
        $this->say($this->admin, '¡Hola! ¿Cuándo podés visitarnos?')->assertOk()->assertJsonCount(2, 'messages');

        $otherShelter = Shelter::create(['name' => 'Otro', 'slug' => 'otro', 'active' => true]);
        $foreignAdmin = User::factory()->create(['role' => 'admin', 'shelter_id' => $otherShelter->id]);
        $this->assertContains($this->say($foreignAdmin)->status(), [403, 404]);
        $this->assertContains($this->actingAs($foreignAdmin)->getJson("/chats/{$this->application->id}")->status(), [403, 404]);
        $this->say(User::factory()->create(['role' => 'adoptante']))->assertForbidden();
        $superadmin = User::factory()->create(['role' => 'superadmin']);
        $this->say($superadmin)->assertForbidden();
        $this->actingAs($superadmin)->getJson('/chats')->assertForbidden();
        $this->say($this->adopter, '')->assertJsonValidationErrors('body');

        $this->assertSame(2, AdoptionMessage::count());
        $this->actingAs($this->adopter)->getJson("/chats/{$this->application->id}")->assertOk()
            ->assertJsonCount(2, 'messages')->assertJsonPath('open', true)->assertJsonPath('messages.1.author.role', 'admin')
            ->assertJsonPath('counterpart', 'Patitas')->assertJsonPath('requestUrl', "/solicitudes/{$this->application->id}");
    }

    public function test_inbox_lists_own_conversations_and_counts_unread_messages(): void
    {
        $other = Shelter::create(['name' => 'Otro', 'slug' => 'otro', 'active' => true]);
        $foreignAnimal = Animal::factory()->create(['shelter_id' => $other->id]);
        $foreign = app(AdoptionService::class)->submit($foreignAnimal, User::factory()->create(['role' => 'adoptante']), ['phone' => '1155551234', 'address' => 'Calle 123', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Experiencia previa.', 'motivation' => 'Un hogar responsable y permanente.']);

        $this->say($this->adopter, 'Hola');
        $this->say($this->adopter, '¿Sigue disponible?');
        $this->actingAs($this->admin)->getJson('/chats')->assertOk()
            ->assertJsonCount(1, 'conversations')->assertJsonPath('conversations.0.id', $this->application->id)
            ->assertJsonPath('conversations.0.unread', 2)->assertJsonPath('unread', 2)
            ->assertJsonPath('conversations.0.counterpart', trim($this->adopter->name.' '.$this->adopter->last_name))
            ->assertJsonPath('conversations.0.last.body', '¿Sigue disponible?');
        $this->assertNotContains($foreign->id, collect($this->actingAs($this->admin)->getJson('/chats')->json('conversations'))->pluck('id'));

        // Abrir la conversación la marca como leída para ese lado; la respuesta queda sin leer para el otro.
        $this->actingAs($this->admin)->getJson("/chats/{$this->application->id}")->assertOk();
        $this->actingAs($this->admin)->getJson('/chats')->assertJsonPath('unread', 0);
        $this->travel(1)->minutes();
        $this->say($this->admin, 'Sí, ¡te esperamos!');
        $this->actingAs($this->adopter)->getJson('/chats')->assertJsonCount(1, 'conversations')
            ->assertJsonPath('conversations.0.unread', 1)->assertJsonPath('conversations.0.counterpart', 'Patitas')
            ->assertJsonPath('conversations.0.deadline', fn ($deadline) => $deadline !== null);
    }

    public function test_shelter_message_starts_the_clock_and_adopter_reply_stops_it(): void
    {
        $this->say($this->admin);
        $since = $this->application->fresh()->awaiting_reply_since;
        $this->assertNotNull($since);
        $this->travel(2)->hours();
        $this->say($this->admin, 'Te escribo de nuevo');
        $this->assertTrue($since->equalTo($this->application->fresh()->awaiting_reply_since), 'Un segundo mensaje del refugio no reinicia el plazo.');

        $this->say($this->adopter, '¡Perdón, recién lo veo!');
        $this->assertNull($this->application->fresh()->awaiting_reply_since);
        $this->travel(72)->hours();
        $this->actingAs($this->adopter)->get('/mis-solicitudes')->assertOk();
        $this->assertSame('Nueva', $this->application->fresh()->status);
    }

    public function test_warning_at_24_hours_and_closure_at_48_hours_release_the_animal(): void
    {
        app(AdoptionService::class)->transition($this->application, $this->admin, 'Aprobada', 'Evaluación favorable.');
        $this->say($this->admin, '¿Coordinamos la entrega?');
        $since = $this->application->fresh()->awaiting_reply_since;

        $this->travel(25)->hours();
        $deadline = $since->copy()->addHours(48)->toIso8601String();
        $this->actingAs($this->adopter)->get("/solicitudes/{$this->application->id}")->assertInertia(fn (Assert $page) => $page
            ->where('chatDeadline', $deadline));
        $this->actingAs($this->adopter)->getJson("/chats/{$this->application->id}")->assertJsonPath('deadline', $deadline);
        $warning = AdoptionMessage::where('type', 'warning')->sole();
        $this->assertTrue($warning->created_at->equalTo($since->copy()->addHours(24)));
        $this->assertStringContainsString('Mora podrá ser adoptado por otra familia', $warning->body);
        $this->assertSame('Aprobada', $this->application->fresh()->status);

        $this->travel(24)->hours();
        $this->actingAs($this->admin)->get('/admin/solicitudes')->assertOk();
        $closed = $this->application->fresh();
        $this->assertSame('Rechazada', $closed->status);
        $this->assertNull($closed->awaiting_reply_since);
        $this->assertSame('Disponible', $this->animal->fresh()->availability_status);
        $this->assertStringContainsString('Cierre automático', $closed->history->last()->observations);
        $this->assertSame(1, AdoptionMessage::where('type', 'system')->count());
        $this->assertSame(1, AdoptionMessage::where('type', 'warning')->count());

        $this->say($this->adopter, 'Llegué tarde')->assertJsonValidationErrors('body');
        $this->actingAs($this->adopter)->getJson("/chats/{$this->application->id}")->assertJsonPath('open', false)->assertJsonPath('deadline', null);
        // Una solicitud cerrada deja de aparecer en la burbuja.
        $this->actingAs($this->adopter)->getJson('/chats')->assertJsonCount(0, 'conversations');
    }

    public function test_scheduled_command_applies_the_deadline_without_visits(): void
    {
        $this->say($this->admin);
        $this->travel(49)->hours();

        $this->artisan('adoptions:expire-inactive')->assertExitCode(0);

        $this->assertSame('Rechazada', $this->application->fresh()->status);
        $this->assertSame(['message', 'warning', 'system'], $this->application->messages()->pluck('type')->all());
    }

    public function test_conversation_continues_after_adoption_without_a_deadline(): void
    {
        $this->actingAs($this->adopter)->getJson("/chats/{$this->application->id}")
            ->assertJsonPath('followUpUrl', null)->assertJsonPath('followUpPending', null);
        $service = app(AdoptionService::class);
        $service->transition($this->application, $this->admin, 'Aprobada', 'Evaluación favorable.');
        $service->transition($this->application->fresh(), $this->admin, 'Adoptado', 'Adopción concretada.');

        $this->say($this->admin, '¿Cómo se está adaptando Mora?');
        $this->assertNull($this->application->fresh()->awaiting_reply_since);
        $this->travel(10)->days();
        $this->say($this->adopter, '¡Muy bien!')->assertOk();
        $this->assertSame('Adoptado', $this->application->fresh()->status);
        $adoption = $this->application->fresh()->adoption;
        $this->actingAs($this->adopter)->get("/solicitudes/{$this->application->id}")->assertInertia(fn (Assert $page) => $page
            ->where('application.adoption.id', $adoption->id));
        $this->actingAs($this->adopter)->getJson('/chats')->assertJsonPath('conversations.0.status', 'Adoptado');
        $this->actingAs($this->adopter)->getJson("/chats/{$this->application->id}")->assertJsonPath('open', true)
            ->assertJsonPath('followUpUrl', "/adopciones/{$adoption->id}/seguimiento")
            // Pasaron 10 días: el control 1 (día 7) y el 2 (día 14, habilitado 7 días antes) esperan fotos.
            ->assertJsonPath('followUpPending', 2);
        $notice = $this->application->messages()->where('type', 'system')->sole();
        $this->assertStringContainsString('botón Seguimiento', $notice->body);
        $this->assertStringContainsString('Mora ya tiene hogar', $notice->body);
    }
}
