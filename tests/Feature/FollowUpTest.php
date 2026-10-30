<?php

namespace Tests\Feature;

use App\Models\Adoption;
use App\Models\Animal;
use App\Models\FollowUpCheckin;
use App\Models\Shelter;
use App\Models\User;
use App\Models\VaccinationCertificate;
use App\Services\AdoptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FollowUpTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $adopter;

    private Adoption $adoption;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $shelter = Shelter::create(['name' => 'Patitas', 'slug' => 'patitas', 'active' => true]);
        $this->admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $this->adopter = User::factory()->create(['role' => 'adoptante']);
        $animal = Animal::factory()->create(['shelter_id' => $shelter->id, 'name' => 'Mora']);
        $service = app(AdoptionService::class);
        $application = $service->submit($animal, $this->adopter, ['phone' => '1155551234', 'address' => 'Calle 123', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Experiencia previa.', 'motivation' => 'Un hogar responsable y permanente.']);
        $service->transition($application, $this->admin, 'Aprobada', 'Evaluación favorable.');
        $service->transition($application->fresh(), $this->admin, 'Adoptado', 'Adopción concretada.');
        $this->adoption = Adoption::sole();
    }

    private function photos(array $except = []): array
    {
        return array_diff_key(['Jugando' => UploadedFile::fake()->image('jugando.jpg'), 'Durmiendo' => UploadedFile::fake()->image('durmiendo.png'),
            'Comiendo' => UploadedFile::fake()->image('comiendo.jpg'), 'Convivencia' => UploadedFile::fake()->image('convivencia.webp')], array_flip($except));
    }

    private function checkin(int $sequence): FollowUpCheckin
    {
        return $this->adoption->checkins()->where('sequence', $sequence)->sole();
    }

    public function test_adoption_schedules_weekly_checkins_for_a_month_then_monthly_until_six_months(): void
    {
        $start = today();
        $expected = [...array_map(fn ($w) => $start->copy()->addWeeks($w)->toDateString(), [1, 2, 3, 4]),
            ...array_map(fn ($m) => $start->copy()->addMonthsNoOverflow($m)->toDateString(), [2, 3, 4, 5, 6])];

        $this->assertSame($expected, $this->adoption->checkins->map(fn ($c) => $c->due_date->toDateString())->all());
        $this->assertSame(range(1, 9), $this->adoption->checkins->pluck('sequence')->all());
    }

    public function test_adopter_sends_four_private_photos_per_checkin(): void
    {
        $first = $this->checkin(1);
        $this->actingAs($this->adopter)->post("/adopciones/{$this->adoption->id}/seguimiento/{$first->id}", ['photos' => $this->photos(['Comiendo'])])
            ->assertSessionHasErrors('photos.Comiendo');
        $this->actingAs($this->adopter)->post("/adopciones/{$this->adoption->id}/seguimiento/{$this->checkin(5)->id}", ['photos' => $this->photos()])
            ->assertSessionHasErrors('photos');

        $this->actingAs($this->adopter)->post("/adopciones/{$this->adoption->id}/seguimiento/{$first->id}", ['photos' => $this->photos(), 'comment' => 'Duerme en el sillón.'])
            ->assertSessionHasNoErrors();
        $first->refresh();
        $this->assertNotNull($first->submitted_at);
        $this->assertSame(['Jugando', 'Durmiendo', 'Comiendo', 'Convivencia'], $first->photos->pluck('category')->all());
        Storage::disk('local')->assertExists($first->photos->pluck('file_path')->all());
        $this->actingAs($this->adopter)->post("/adopciones/{$this->adoption->id}/seguimiento/{$first->id}", ['photos' => $this->photos()])
            ->assertSessionHasErrors('photos');
        $this->assertSame(4, $first->photos()->count());

        $photo = $first->photos->first();
        $url = "/adopciones/{$this->adoption->id}/archivos/fotos/{$photo->id}";
        $this->actingAs($this->adopter)->get($url)->assertOk();
        $this->actingAs($this->admin)->get($url)->assertOk();
        $this->actingAs(User::factory()->create(['role' => 'adoptante']))->get($url)->assertForbidden();
        $foreign = User::factory()->create(['role' => 'admin', 'shelter_id' => Shelter::create(['name' => 'Otro', 'slug' => 'otro', 'active' => true])->id]);
        $this->assertContains($this->actingAs($foreign)->get($url)->status(), [403, 404]);
        $this->assertContains($this->actingAs($foreign)->get("/adopciones/{$this->adoption->id}/seguimiento")->status(), [403, 404]);

        $this->actingAs($this->adopter)->get("/adopciones/{$this->adoption->id}/seguimiento")->assertInertia(fn (Assert $page) => $page
            ->component('FollowUp/Show')->where('canSubmit', true)->where('canReview', false)
            ->has('adoption.checkins', 9)->has('adoption.checkins.0.photos', 4)->missing('adoption.checkins.0.photos.0.file_path'));
    }

    public function test_shelter_reviews_checkins_and_vaccination_certificates(): void
    {
        $first = $this->checkin(1);
        $this->actingAs($this->adopter)->post("/adopciones/{$this->adoption->id}/seguimiento/{$first->id}", ['photos' => $this->photos()]);
        $this->actingAs($this->adopter)->patch("/adopciones/{$this->adoption->id}/seguimiento/{$first->id}", ['shelter_note' => 'Yo mismo'])->assertForbidden();
        $this->actingAs($this->admin)->patch("/adopciones/{$this->adoption->id}/seguimiento/{$first->id}", ['shelter_note' => '¡Se la ve feliz!'])->assertSessionHasNoErrors();
        $this->assertSame('¡Se la ve feliz!', $first->fresh()->shelter_note);
        $this->assertSame($this->admin->id, $first->fresh()->reviewed_by);
        $this->actingAs($this->admin)->patch("/adopciones/{$this->adoption->id}/seguimiento/{$this->checkin(2)->id}")->assertSessionHasErrors('shelter_note');

        $base = ['vaccine_name' => 'Séxtuple', 'application_date' => today()->toDateString()];
        $this->actingAs($this->adopter)->post("/adopciones/{$this->adoption->id}/certificados", $base + ['file' => UploadedFile::fake()->create('hoja.svg', 10, 'image/svg+xml')])->assertSessionHasErrors('file');
        $this->actingAs($this->adopter)->post("/adopciones/{$this->adoption->id}/certificados", ['vaccine_name' => 'Séxtuple', 'application_date' => today()->addDay()->toDateString(), 'file' => UploadedFile::fake()->image('hoja.jpg')])->assertSessionHasErrors('application_date');
        $this->actingAs(User::factory()->create(['role' => 'adoptante']))->post("/adopciones/{$this->adoption->id}/certificados", $base + ['file' => UploadedFile::fake()->image('hoja.jpg')])->assertForbidden();
        $this->actingAs($this->adopter)->post("/adopciones/{$this->adoption->id}/certificados", $base + ['file' => UploadedFile::fake()->image('hoja.jpg')])->assertSessionHasNoErrors();
        $this->actingAs($this->adopter)->post("/adopciones/{$this->adoption->id}/certificados", ['vaccine_name' => 'Antirrábica', 'application_date' => today()->toDateString(), 'file' => UploadedFile::fake()->create('hoja.pdf', 50, 'application/pdf')])->assertSessionHasNoErrors();

        $certificate = VaccinationCertificate::where('vaccine_name', 'Séxtuple')->sole();
        Storage::disk('local')->assertExists($certificate->file_path);
        $this->actingAs($this->adopter)->patch("/adopciones/{$this->adoption->id}/certificados/{$certificate->id}")->assertForbidden();
        $this->actingAs($this->admin)->patch("/adopciones/{$this->adoption->id}/certificados/{$certificate->id}")->assertSessionHasNoErrors();
        $this->assertNotNull($certificate->fresh()->reviewed_at);
        $this->actingAs($this->admin)->get("/adopciones/{$this->adoption->id}/archivos/certificados/{$certificate->id}")->assertOk();
        $this->assertSame(2, $this->adoption->certificates()->count());
    }

    public function test_adoptions_registered_before_this_feature_get_their_schedule_when_opened(): void
    {
        FollowUpCheckin::query()->delete();

        $this->actingAs($this->admin)->get("/adopciones/{$this->adoption->id}/seguimiento")->assertInertia(fn (Assert $page) => $page
            ->has('adoption.checkins', 9)->where('canReview', true)->where('canSubmit', false));
    }
}
