<?php

namespace Tests\Feature\Admin;

use App\Models\Animal;
use App\Models\AnimalPhoto;
use App\Models\Shelter;
use App\Models\User;
use App\Services\AdoptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AnimalManagementTest extends TestCase
{
    use RefreshDatabase;

    private Shelter $shelter;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        Request::enableHttpMethodParameterOverride();
        Storage::fake('public');
        $this->shelter = Shelter::create(['name' => 'Sur', 'slug' => 'sur', 'active' => true]);
        $this->admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $this->shelter->id]);
    }

    private function payload(array $changes = []): array
    {
        return array_replace(Animal::factory()->make()->getAttributes(), $changes);
    }

    private function image(string $extension = 'png')
    {
        $bytes = match ($extension) {
            'jpg' => file_get_contents(public_path('images/demo/gato.jpg')),
            'webp' => base64_decode('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA'),
            default => base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='),
        };

        return UploadedFile::fake()->createWithContent('foto familiar.'.$extension, $bytes);
    }

    public function test_multipart_multiple_photos_second_upload_primary_and_deletion_are_consistent(): void
    {
        $this->actingAs($this->admin)->post('/admin/animales', $this->payload(['photos' => [$this->image('jpg'), $this->image('png'), $this->image('webp')]]))->assertSessionHasNoErrors();
        $animal = Animal::firstWhere('shelter_id', $this->shelter->id);
        $this->assertCount(3, $animal->photos);
        foreach ($animal->photos as $photo) {
            Storage::disk('public')->assertExists($photo->file_path);
            $this->assertMatchesRegularExpression('~^animals/[a-zA-Z0-9]+\.(jpg|png|webp)$~', $photo->file_path);
        }
        $first = $animal->photos->first();
        $last = $animal->photos->last();
        $this->post('/admin/animales/'.$animal->id, $this->payload(['_method' => 'put', 'photos' => [$this->image()]]))->assertSessionHasNoErrors();
        $this->assertSame(4, $animal->photos()->count());
        $this->patch('/admin/animales/'.$animal->id.'/fotos/'.$last->id)->assertSessionHasNoErrors();
        $this->assertSame($last->id, $animal->photos()->where('is_primary', true)->sole()->id);
        $this->delete('/admin/animales/'.$animal->id.'/fotos/'.$first->id)->assertSessionHasNoErrors();
        $this->assertSame($last->id, $animal->photos()->where('is_primary', true)->sole()->id);
        $this->delete('/admin/animales/'.$animal->id.'/fotos/'.$last->id)->assertSessionHasNoErrors();
        $this->assertSame(1, $animal->photos()->where('is_primary', true)->count());
        Storage::disk('public')->assertMissing($first->file_path);
        Storage::disk('public')->assertMissing($last->file_path);
        foreach ($animal->photos()->get() as $remaining) {
            $this->delete('/admin/animales/'.$animal->id.'/fotos/'.$remaining->id)->assertSessionHasNoErrors();
        }
        $this->assertSame('/images/animal-placeholder.svg', $animal->fresh()->photo_url);
    }

    public function test_invalid_photos_size_count_and_spoofed_content_do_not_write_files_or_animals(): void
    {
        $this->actingAs($this->admin);
        foreach ([
            UploadedFile::fake()->createWithContent('foto.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>'),
            UploadedFile::fake()->createWithContent('fake.jpg', 'not an image'),
            $this->image()->size(4097),
        ] as $file) {
            $this->post('/admin/animales', $this->payload(['photos' => [$file]]))->assertSessionHasErrors('photos.0');
        }
        $this->post('/admin/animales', $this->payload(['photos' => array_map(fn () => $this->image(), range(1, 9))]))->assertSessionHasErrors('photos');
        $this->assertDatabaseCount('animals', 0);
        $this->assertSame([], Storage::disk('public')->allFiles('animals'));
    }

    public function test_failed_photo_record_rolls_back_animal_and_cleans_new_files(): void
    {
        AnimalPhoto::saving(fn () => false);
        try {
            $this->actingAs($this->admin)->post('/admin/animales', $this->payload(['photos' => [$this->image()]]))->assertSessionHasErrors('photos');
            $this->assertDatabaseCount('animals', 0);
            $this->assertDatabaseCount('animal_photos', 0);
            $this->assertSame([], Storage::disk('public')->allFiles('animals'));
        } finally {
            AnimalPhoto::flushEventListeners();
        }
    }

    public function test_photo_actions_and_animal_writes_cannot_cross_institutions(): void
    {
        $other = Shelter::create(['name' => 'Norte', 'slug' => 'norte', 'active' => true]);
        $own = Animal::factory()->create(['shelter_id' => $this->shelter->id]);
        $foreign = Animal::factory()->create(['shelter_id' => $other->id]);
        $photo = $foreign->photos()->create(['file_path' => 'animals/foreign.jpg', 'is_primary' => true]);
        Storage::disk('public')->put($photo->file_path, 'keep');
        $this->actingAs($this->admin);
        foreach ([$foreign, $own] as $routeAnimal) {
            $this->patch('/admin/animales/'.$routeAnimal->id.'/fotos/'.$photo->id)->assertNotFound();
            $this->delete('/admin/animales/'.$routeAnimal->id.'/fotos/'.$photo->id)->assertNotFound();
        }
        $this->put('/admin/animales/'.$foreign->id, $this->payload())->assertNotFound();
        $this->post('/admin/animales', $this->payload(['name' => 'Nombre largo '.str_repeat('x', 70), 'shelter_id' => $other->id]))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('animals', ['name' => 'Nombre largo '.str_repeat('x', 70), 'shelter_id' => $this->shelter->id]);
        Storage::disk('public')->assertExists($photo->file_path);
    }

    public function test_reservation_and_final_adoption_cannot_be_released_by_crud_and_archive_keeps_history(): void
    {
        $animal = Animal::factory()->create(['shelter_id' => $this->shelter->id]);
        $adopter = User::factory()->create();
        $service = app(AdoptionService::class);
        $request = $service->submit($animal, $adopter, ['phone' => '1155551234', 'address' => 'Calle ficticia', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Experiencia', 'motivation' => 'Hogar responsable']);
        $this->actingAs($this->admin)->put('/admin/animales/'.$animal->id, $this->payload(['availability_status' => 'No disponible temporalmente']))->assertSessionHasErrors('availability_status');
        $this->delete('/admin/animales/'.$animal->id)->assertSessionHasErrors('animal');
        $service->transition($request, $this->admin, 'Aprobada', 'Aprobación ficticia');
        $this->put('/admin/animales/'.$animal->id, $this->payload())->assertSessionHasNoErrors();
        $this->assertSame('En proceso de adopción', $animal->fresh()->availability_status);
        $this->delete('/admin/animales/'.$animal->id)->assertSessionHasErrors('animal');
        $service->transition($request, $this->admin, 'Adoptado', 'Registro ficticio definitivo');
        $this->put('/admin/animales/'.$animal->id, $this->payload())->assertSessionHasNoErrors();
        $this->assertSame('Adoptado', $animal->fresh()->availability_status);
        $photo = $animal->photos()->create(['file_path' => 'animals/history.jpg', 'is_primary' => true]);
        Storage::disk('public')->put($photo->file_path, 'keep');
        $this->delete('/admin/animales/'.$animal->id)->assertSessionHasNoErrors();
        $this->assertSoftDeleted($animal);
        $this->assertDatabaseCount('adoptions', 1);
        $this->assertDatabaseCount('adoption_request_history', 3);
        Storage::disk('public')->assertExists($photo->file_path);
        $this->get('/admin/animales/'.$animal->id.'/edit')->assertNotFound();
    }

    public function test_combined_search_archive_and_pagination_are_scoped_and_preserved(): void
    {
        Animal::factory()->count(17)->create(['shelter_id' => $this->shelter->id, 'name' => 'Coincidencia extensa', 'species' => 'Gato', 'availability_status' => 'Disponible']);
        $archived = Animal::factory()->create(['shelter_id' => $this->shelter->id, 'name' => 'Coincidencia archivada', 'species' => 'Gato']);
        $archived->delete();
        $other = Shelter::create(['name' => 'Norte', 'slug' => 'norte', 'active' => true]);
        Animal::factory()->create(['shelter_id' => $other->id, 'name' => 'Coincidencia ajena', 'species' => 'Gato']);
        $this->actingAs($this->admin)->get('/admin/animales?q=Coincidencia&species=Gato&status=Disponible&archive=active&page=2')
            ->assertInertia(fn (Assert $p) => $p->where('animals.total', 17)->has('animals.data', 2)->where('filters.archive', 'active')->where('animals.prev_page_url', url('/admin/animales?q=Coincidencia&species=Gato&status=Disponible&archive=active&page=1')));
        $this->get('/admin/animales?archive=archived')->assertInertia(fn (Assert $p) => $p->has('animals.data', 1)->where('animals.data.0.id', $archived->id));
        $this->get('/admin/animales?q=Sin-coincidencias&archive=all')->assertInertia(fn (Assert $p) => $p->has('animals.data', 0));
        $this->get('/admin/animales?status=arbitrario')->assertSessionHasErrors('status');
    }
}
