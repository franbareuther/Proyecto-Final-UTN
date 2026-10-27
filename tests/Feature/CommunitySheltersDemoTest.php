<?php

namespace Tests\Feature;

use App\Models\Shelter;
use Database\Seeders\CommunitySheltersDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CommunitySheltersDemoTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_adds_three_shelters_and_six_dogs_without_duplicates_or_changing_existing_shelters(): void
    {
        Storage::fake('public');
        $original = Shelter::create(['name' => 'Refugio existente', 'slug' => 'existente', 'city' => 'Ciudad original', 'active' => true]);
        $before = $original->fresh()->getAttributes();
        $shelterCount = Shelter::count();

        $this->seed(CommunitySheltersDemoSeeder::class);
        $this->seed(CommunitySheltersDemoSeeder::class);

        $this->assertDatabaseCount('shelters', $shelterCount + 3);
        $this->assertDatabaseCount('animals', 6);
        $this->assertDatabaseCount('animal_photos', 6);
        $this->assertSame($before, $original->fresh()->getAttributes());
        Storage::disk('public')->assertExists('community-demo/tango.jpg');
        Storage::disk('public')->assertExists('community-demo/los-aromos.jpg');
        $this->get('/')->assertInertia(fn (Assert $page) => $page->has('animals', 6)->has('refuges', 3)->where('refuges.0.slug', 'refugio-la-ribera-demo'));
        $this->get('/creditos-fotografias')->assertInertia(fn (Assert $page) => $page->has('photos', 9)->where('photos.0.license', 'CC BY-SA 3.0'));
    }
}
