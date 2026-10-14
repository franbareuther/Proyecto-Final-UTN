<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shelters', function (Blueprint $table) {
            $table->string('image_path')->nullable();
            $table->string('image_type', 10)->default('photo');
        });
    }

    public function down(): void
    {
        Schema::table('shelters', fn (Blueprint $table) => $table->dropColumn(['image_path', 'image_type']));
    }
};
