<?php

namespace Tests\Feature\Catalog;

use App\Models\Shelter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Testing\File;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ShelterImageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Request::enableHttpMethodParameterOverride();
    }

    private function refuge(string $slug = 'sur'): Shelter
    {
        return Shelter::create(['name' => 'Refugio '.$slug, 'slug' => $slug, 'active' => true]);
    }

    private function image(string $name): File
    {
        // Actual image bytes, without requiring GD in developer machines or CI.
        $content = match (pathinfo($name, PATHINFO_EXTENSION)) {
            'jpg' => file_get_contents(public_path('images/demo/gato.jpg')),
            'png' => base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='),
            'webp' => base64_decode('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA'),
            default => base64_decode('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='),
        };

        return UploadedFile::fake()->createWithContent($name, $content);
    }

    private function superadmin(): User
    {
        return User::factory()->create(['role' => 'superadmin', 'shelter_id' => null]);
    }

    private function payload(Shelter $shelter): array
    {
        return ['name' => $shelter->name, 'slug' => $shelter->slug, 'active' => true, '_method' => 'patch'];
    }

    public function test_multipart_creation_and_replacement_accept_jpeg_png_and_webp_with_server_names(): void
    {
        $this->actingAs($this->superadmin())->post('/superadmin/refugios', [
            'name' => 'Nuevo', 'slug' => 'nuevo', 'active' => true,
            'image' => $this->image('un nombre del cliente.jpg'), 'image_type' => 'photo',
        ])->assertSessionHasNoErrors()->assertRedirect();
        $shelter = Shelter::where('slug', 'nuevo')->firstOrFail();
        $this->assertMatchesRegularExpression('~^shelters/[a-zA-Z0-9]+\.jpg$~', $shelter->image_path);
        foreach (['png', 'webp'] as $extension) {
            $old = $shelter->image_path;
            Storage::disk('public')->assertExists($old);
            $this->post('/superadmin/refugios/nuevo', $this->payload($shelter) + [
                'image' => $this->image('logo.'.$extension), 'image_type' => 'logo',
            ])->assertSessionHasNoErrors()->assertRedirect();
            $shelter->refresh();
            $this->assertNotSame($old, $shelter->image_path);
            $this->assertSame('logo', $shelter->image_type);
            Storage::disk('public')->assertMissing($old);
            Storage::disk('public')->assertExists($shelter->image_path);
        }
        $this->assertCount(1, Storage::disk('public')->allFiles('shelters'));
    }

    public function test_invalid_format_size_kind_and_forged_paths_do_not_replace_existing_image(): void
    {
        $shelter = $this->refuge();
        $old = $this->image('old.png')->store('shelters', 'public');
        $shelter->image_path = $old;
        $shelter->save();
        $this->actingAs($this->superadmin());
        foreach ([
            [UploadedFile::fake()->create('logo.svg', 1, 'image/svg+xml')],
            [$this->image('large.png')->size(5121)],
            [UploadedFile::fake()->createWithContent('pretend.jpg', 'not an image')],
            [$this->image('bitmap.gif')],
        ] as [$file]) {
            $response = $this->post('/superadmin/refugios/sur', $this->payload($shelter) + ['image' => $file]);
            $this->assertTrue(session()->has('errors'), 'Expected invalid upload: '.$file->getClientOriginalName());
            $response->assertSessionHasErrors('image');
            $this->assertSame($old, $shelter->fresh()->image_path);
        }
        $this->post('/superadmin/refugios/sur', $this->payload($shelter) + ['image_type' => 'stretch', 'image_path' => 'animals/private.jpg', 'image_url' => '/private'])
            ->assertSessionHasErrors(['image_type', 'image_path', 'image_url']);
        $this->post('/superadmin/refugios/sur', $this->payload($shelter) + ['remove_image' => true, 'image' => $this->image('new.png')])
            ->assertSessionHasErrors('image');
        Storage::disk('public')->assertExists($old);
        $this->assertCount(1, Storage::disk('public')->allFiles('shelters'));
    }

    public function test_admin_can_replace_remove_and_keep_own_image_without_touching_animal_photos(): void
    {
        $shelter = $this->refuge();
        $this->actingAs(User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]));
        Storage::disk('public')->put('animals/preserved.jpg', 'animal photo');
        $this->post('/admin/refugio', ['name' => 'Mi refugio', '_method' => 'patch', 'image' => $this->image('logo.png'), 'image_type' => 'logo'])
            ->assertSessionHasNoErrors();
        $old = $shelter->fresh()->image_path;
        $this->patch('/admin/refugio', ['name' => 'Nombre actualizado'])->assertSessionHasNoErrors();
        $this->assertSame($old, $shelter->fresh()->image_path);
        $this->post('/admin/refugio', ['name' => 'Mi refugio', '_method' => 'patch', 'image' => $this->image('photo.jpg'), 'image_type' => 'photo'])
            ->assertSessionHasNoErrors();
        Storage::disk('public')->assertMissing($old);
        $new = $shelter->fresh()->image_path;
        $this->post('/admin/refugio', ['name' => 'Mi refugio', '_method' => 'patch', 'remove_image' => true])->assertSessionHasNoErrors();
        $this->assertNull($shelter->fresh()->image_path);
        $this->assertNull($shelter->fresh()->image_url);
        Storage::disk('public')->assertMissing($new);
        Storage::disk('public')->assertExists('animals/preserved.jpg');
    }

    public function test_authorization_prevents_adopter_and_foreign_staff_uploads(): void
    {
        $own = $this->refuge();
        $foreign = $this->refuge('norte');
        $this->actingAs(User::factory()->create(['role' => 'adoptante']))
            ->post('/superadmin/refugios', ['image' => $this->image('forbidden.png')])->assertForbidden();
        $this->post('/admin/refugio', ['_method' => 'patch', 'name' => 'Ataque'])->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'admin', 'shelter_id' => $own->id]))
            ->post('/superadmin/refugios/norte', $this->payload($foreign) + ['image' => $this->image('foreign.png')])->assertForbidden();
        $this->post('/admin/refugio', ['_method' => 'patch', 'name' => $own->name, 'shelter_id' => $foreign->id, 'image' => $this->image('own.png')])->assertSessionHasNoErrors();
        $this->assertNull($foreign->fresh()->image_path);
        $this->assertNotNull($own->fresh()->image_path);
    }

    public function test_failed_database_save_removes_new_file_and_keeps_previous_image(): void
    {
        $shelter = $this->refuge();
        $old = $this->image('old.png')->store('shelters', 'public');
        $shelter->image_path = $old;
        $shelter->save();
        $this->actingAs($this->superadmin())->withoutExceptionHandling();
        Shelter::saving(function () use ($old) {
            Storage::disk('public')->assertExists($old);
            throw new \RuntimeException('Simulated database failure');
        });
        try {
            $this->post('/superadmin/refugios/sur', $this->payload($shelter) + ['image' => $this->image('new.png')]);
            $this->fail('The database failure should propagate.');
        } catch (\RuntimeException $error) {
            $this->assertSame('Simulated database failure', $error->getMessage());
        } finally {
            Shelter::flushEventListeners();
        }
        $this->assertSame($old, $shelter->fresh()->image_path);
        $this->assertSame([$old], Storage::disk('public')->allFiles('shelters'));
    }

    public function test_existing_refuge_without_image_and_all_three_public_payloads_remain_compatible(): void
    {
        $shelter = $this->refuge();
        $this->assertNull($shelter->fresh()->image_url);
        $this->assertSame('photo', $shelter->fresh()->image_type);
        $this->get('/refugios/sur')->assertOk();
        $shelter->image_path = $this->image('logo.png')->store('shelters', 'public');
        $shelter->image_type = 'logo';
        $shelter->save();
        $this->get('/refugios/sur')->assertInertia(fn (Assert $p) => $p->where('shelter.image_url', $shelter->image_url)->where('shelter.image_type', 'logo'));
        $this->get('/refugios?q=sur')->assertInertia(fn (Assert $p) => $p->where('shelters.data.0.image_url', $shelter->image_url));
        $this->get('/')->assertInertia(fn (Assert $p) => $p->where('refuges', fn ($refuges) => collect($refuges)->firstWhere('id', $shelter->id)['image_url'] === $shelter->image_url));
    }

    public function test_cancelled_save_does_not_delete_the_previous_file_or_leave_a_new_one(): void
    {
        $shelter = $this->refuge();
        $old = $this->image('old.png')->store('shelters', 'public');
        $shelter->image_path = $old;
        $shelter->save();
        $this->actingAs($this->superadmin());
        Shelter::saving(fn () => false);
        try {
            $this->post('/superadmin/refugios/sur', $this->payload($shelter) + ['image' => $this->image('new.png')])
                ->assertSessionHasErrors('image');
        } finally {
            Shelter::flushEventListeners();
        }
        $this->assertSame($old, $shelter->fresh()->image_path);
        $this->assertSame([$old], Storage::disk('public')->allFiles('shelters'));
    }
}
