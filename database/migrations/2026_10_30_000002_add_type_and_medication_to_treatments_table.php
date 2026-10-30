<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Los tratamientos existentes quedan como "Tratamiento"; desparasitaciones y medicaciones reutilizan la misma tabla.
        Schema::table('treatments', function (Blueprint $table) {
            $table->string('treatment_type', 30)->default('Tratamiento')->after('animal_id');
            $table->string('medication')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('treatments', fn (Blueprint $table) => $table->dropColumn(['treatment_type', 'medication']));
    }
};
