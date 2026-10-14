<?php

namespace Tests\Feature\Catalog;

use App\Models\AdoptionRequest;
use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicUxTest extends TestCase
{
    use RefreshDatabase;

    private function refuge(string $slug, string $city = 'Rosario', bool $active = true): Shelter
    {
        return Shelter::create(['name' => 'Refugio '.$slug, 'slug' => $slug, 'city' => $city, 'active' => $active]);
    }

    public function test_scoped_url_removes_network_filters_before_validation_and_preserves_search_and_page(): void
    {
        $sur = $this->refuge('sur');
        Animal::factory()->count(14)->create(['shelter_id' => $sur->id, 'species' => 'Gato']);
        $this->get('/refugios/sur/animales?city[]=ajena&shelter=norte&species=Gato&page=2')
            ->assertRedirect('/refugios/sur/animales?species=Gato&page=2');
        $this->get('/refugios/sur/animales?species=Gato&page=2')->assertInertia(fn (Assert $p) => $p
            ->where('shelter.id', $sur->id)->where('filters', ['species' => 'Gato'])
            ->where('animals.total', 14)->has('animals.data', 2)
            ->where('animals.prev_page_url', url('/refugios/sur/animales?species=Gato&page=1')));
    }

    public function test_all_filters_combine_across_active_refuges_and_keep_pagination(): void
    {
        $sur = $this->refuge('sur');
        $norte = $this->refuge('norte', 'Córdoba');
        $hidden = $this->refuge('oculto', active: false);
        $attributes = ['name' => 'Mora', 'species' => 'Gato', 'breed' => 'Siamés', 'size' => 'Pequeño', 'estimated_age' => 8, 'availability_status' => 'Disponible'];
        Animal::factory()->count(13)->create($attributes + ['shelter_id' => $sur->id]);
        Animal::factory()->create($attributes + ['shelter_id' => $norte->id]);
        Animal::factory()->create($attributes + ['shelter_id' => $hidden->id]);
        // Each predicate must independently exclude a nonmatching record.
        foreach (['name' => 'Bruno', 'species' => 'Perro', 'breed' => 'Mestizo', 'size' => 'Grande', 'estimated_age' => 24, 'availability_status' => 'Adoptado'] as $field => $value) {
            Animal::factory()->create(array_replace($attributes, [$field => $value, 'shelter_id' => $sur->id]));
        }
        $archived = Animal::factory()->create($attributes + ['shelter_id' => $sur->id]);
        $archived->delete();
        $query = http_build_query(['q' => 'Mora', 'species' => 'Gato', 'breed' => 'Siamés', 'size' => 'Pequeño', 'age' => 'young', 'status' => 'Disponible', 'city' => 'Rosario', 'shelter' => 'sur']);
        $this->get('/animales?'.$query)->assertInertia(fn (Assert $p) => $p
            ->where('animals.total', 13)->has('animals.data', 12)
            ->where('animals.next_page_url', url('/animales?'.$query.'&page=2')));
        $this->get('/animales?'.$query.'&page=2')->assertInertia(fn (Assert $p) => $p
            ->has('animals.data', 1)->where('animals.data.0.shelter.id', $sur->id));
        $this->get('/animales?shelter=oculto')->assertInertia(fn (Assert $p) => $p->where('animals.total', 0));
        $this->get('/refugios/oculto/animales?city=Rosario')->assertNotFound();
    }

    public function test_empty_results_and_unknown_breed_keep_the_applied_query(): void
    {
        $sur = $this->refuge('sur');
        Animal::factory()->create(['shelter_id' => $sur->id, 'breed' => 'Mestizo']);
        $this->get('/refugios/sur/animales?breed=Inexistente')->assertInertia(fn (Assert $p) => $p
            ->where('filters.breed', 'Inexistente')->where('animals.total', 0)->has('animals.data', 0));
        $this->get('/refugios/sur/animales')->assertInertia(fn (Assert $p) => $p->where('animals.total', 1));
    }

    public function test_age_boundaries_use_birth_date_before_estimate(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 14)->startOfDay());
        foreach ([11, 12, 95, 96] as $months) {
            Animal::factory()->create(['birth_date' => today()->subMonths($months), 'estimated_age' => 2]);
            Animal::factory()->create(['birth_date' => null, 'estimated_age' => $months]);
        }
        foreach (['young' => 2, 'adult' => 4, 'senior' => 2] as $age => $count) {
            $this->get('/animales?age='.$age)->assertInertia(fn (Assert $p) => $p->where('animals.total', $count));
        }
    }

    public function test_invalid_search_returns_field_errors_without_running_a_broader_query(): void
    {
        $this->from('/animales')->get('/animales?'.http_build_query(['q' => str_repeat('x', 101), 'age' => 'invalid', 'status' => 'invalid']))
            ->assertRedirect('/animales')->assertSessionHasErrors(['q', 'age', 'status']);
    }

    public function test_pagination_is_stable_when_creation_times_are_equal_and_missing_photos_have_a_fallback(): void
    {
        $records = Animal::factory()->count(14)->create(['created_at' => '2026-10-14 12:00:00']);
        $this->get('/animales')->assertInertia(fn (Assert $p) => $p
            ->where('animals.data', fn ($data) => collect($data)->pluck('id')->all() === $records->pluck('id')->reverse()->take(12)->values()->all())
            ->where('animals.data.0.photo_url', '/images/animal-placeholder.svg'));
        $this->get('/animales?page=2')->assertInertia(fn (Assert $p) => $p
            ->where('animals.data', fn ($data) => collect($data)->pluck('id')->all() === $records->pluck('id')->reverse()->skip(12)->values()->all()));
    }

    public function test_public_payloads_keep_responsible_refuge_and_photos_without_private_relations(): void
    {
        $sur = $this->refuge('sur');
        $animal = Animal::factory()->create(['shelter_id' => $sur->id, 'name' => str_repeat('Nombre extenso ', 7), 'public_health_info' => 'Cuidados públicos']);
        $animal->photos()->create(['file_path' => 'animals/secondary.jpg', 'is_primary' => false]);
        $primary = $animal->photos()->create(['file_path' => 'animals/primary.jpg', 'is_primary' => true]);
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $sur->id]);
        $animal->consultations()->create(['recorded_by' => $admin->id, 'consultation_date' => today(), 'reason' => 'Interno', 'diagnosis' => 'SECRETO CLINICO']);
        AdoptionRequest::unguarded(fn () => $animal->requests()->create(['user_id' => User::factory()->create()->id, 'phone' => 'PRIVADO', 'address' => 'DOMICILIO PRIVADO', 'housing_type' => 'Casa', 'has_other_pets' => false, 'previous_experience' => 'Privada', 'motivation' => 'PRIVADA', 'status' => 'Nueva']));
        foreach (['/animales/'.$animal->id, '/refugios/sur/animales/'.$animal->id] as $url) {
            $this->get($url)->assertInertia(fn (Assert $p) => $p
                ->where('animal.name', $animal->name)->where('animal.shelter.id', $sur->id)
                ->where('animal.photos.0.id', $primary->id)->where('animal.public_health_info', 'Cuidados públicos')
                ->missing('animal.consultations')->missing('animal.requests')->missing('animal.treatments')
                ->missing('animal.vaccinations')->missing('animal.controls')->missing('animal.adoption'))
                ->assertDontSee('SECRETO CLINICO')->assertDontSee('DOMICILIO PRIVADO');
        }
        foreach (['/', '/animales', '/refugios/sur/animales'] as $url) {
            $this->get($url)->assertOk()->assertDontSee('SECRETO CLINICO')->assertDontSee('DOMICILIO PRIVADO');
        }
        $this->get('/refugios/otro/animales/'.$animal->id)->assertNotFound();
    }
}
