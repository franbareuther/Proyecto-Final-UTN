<?php

namespace Tests\Feature;

use App\Models\Adoption;
use App\Models\Animal;
use App\Models\Shelter;
use App\Models\User;
use Database\Seeders\DashboardActivityDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardActivityDemoTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_fills_every_active_shelter_dashboard_without_duplicates(): void
    {
        Storage::fake('public');
        $staffed = Shelter::create(['name' => 'Refugio con equipo', 'slug' => 'con-equipo', 'active' => true]);
        $unstaffed = Shelter::create(['name' => 'Refugio sin equipo', 'slug' => 'sin-equipo', 'active' => true]);
        Shelter::create(['name' => 'Refugio inactivo', 'slug' => 'inactivo', 'active' => false]);
        $admin = User::factory()->create();
        $admin->role = 'admin';
        $admin->shelter_id = $staffed->id;
        $admin->save();

        $this->seed(DashboardActivityDemoSeeder::class);
        $this->seed(DashboardActivityDemoSeeder::class);

        // Las migraciones ya crean el refugio inicial; cada refugio activo recibe nueve fichas y cinco adopciones.
        $active = Shelter::where('active', true)->count();
        $this->assertDatabaseCount('animals', 9 * $active);
        $this->assertDatabaseCount('adoptions', 5 * $active);
        $this->assertSame(0, Animal::whereHas('shelter', fn ($q) => $q->where('active', false))->count());
        $this->assertSame(Adoption::count(), Adoption::distinct()->count('animal_id'));
        $this->assertDatabaseHas('users', ['email' => 'equipo.sin-equipo@huella.test', 'role' => 'admin', 'shelter_id' => $unstaffed->id]);
        $this->assertSame(0, DB::table('adoption_requests')->where('status', 'Aprobada')->select('animal_id')->groupBy('animal_id')->havingRaw('COUNT(*) > 1')->count());

        $this->actingAs($admin)->get('/admin')->assertInertia(fn (Assert $page) => $page
            ->where('stats.Animales registrados', 9)
            ->where('stats.Disponibles', 3)
            ->where('stats.Adopciones realizadas', 5)
            ->where('stats.Solicitudes pendientes', 3)
            ->where('stats.Animales en tratamiento', 3)
            ->where('stats.Controles en 30 días', 4)
            ->where('stats.Dosis pendientes hasta 30 días (incluye vencidas)', 3)
            ->where('months', fn ($months) => collect($months)->filter(fn ($m) => $m['total'] > 0)->count() === 5)
            ->has('statuses', 5));
    }

    public function test_demo_is_rejected_outside_local_and_testing(): void
    {
        $this->app['env'] = 'production';

        $this->expectException(\RuntimeException::class);
        app(DashboardActivityDemoSeeder::class)->run();
    }
}
