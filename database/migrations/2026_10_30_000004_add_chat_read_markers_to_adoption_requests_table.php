<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Última lectura de cada lado de la conversación, para contar los mensajes sin leer.
        Schema::table('adoption_requests', function (Blueprint $t) {
            $t->timestamp('adopter_read_at')->nullable();
            $t->timestamp('shelter_read_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('adoption_requests', fn (Blueprint $t) => $t->dropColumn(['adopter_read_at', 'shelter_read_at']));
    }
};
