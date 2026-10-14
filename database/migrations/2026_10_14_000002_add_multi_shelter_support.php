<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shelters', function (Blueprint $t) {
            $t->id();
            $t->string('name', 100);
            $t->string('slug', 100)->unique();
            $t->text('description')->nullable();
            $t->string('city', 100)->nullable();
            $t->string('address')->nullable();
            $t->string('email')->nullable();
            $t->string('phone', 50)->nullable();
            $t->boolean('active')->default(true)->index();
            $t->timestamps();
        });
        $initial = DB::table('shelters')->insertGetId([
            'name' => 'Refugio inicial', 'slug' => 'huella-inicial', 'active' => true,
            'description' => 'Refugio que reúne los registros anteriores a la plataforma multirrefugio.',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        Schema::table('users', function (Blueprint $t) {
            $t->string('role', 30)->default('adoptante')->change();
            $t->foreignId('shelter_id')->nullable()->constrained()->restrictOnDelete();
        });
        Schema::table('animals', function (Blueprint $t) {
            $t->foreignId('shelter_id')->nullable()->constrained()->restrictOnDelete();
            $t->index(['shelter_id', 'availability_status']);
        });
        DB::table('users')->whereIn('role', ['admin', 'veterinario'])->update(['shelter_id' => $initial]);
        DB::table('animals')->update(['shelter_id' => $initial]);
        Schema::table('animals', fn (Blueprint $t) => $t->foreignId('shelter_id')->nullable(false)->change());
    }

    public function down(): void
    {
        // El rollback elimina la separación; nunca se ejecuta como actualización normal.
        DB::table('users')->where('role', 'superadmin')->update(['role' => 'adoptante']);
        Schema::table('animals', function (Blueprint $t) {
            $t->dropForeign(['shelter_id']);
            $t->dropIndex(['shelter_id', 'availability_status']);
            $t->dropColumn('shelter_id');
        });
        Schema::table('users', fn (Blueprint $t) => $t->dropConstrainedForeignId('shelter_id'));
        Schema::dropIfExists('shelters');
    }
};
