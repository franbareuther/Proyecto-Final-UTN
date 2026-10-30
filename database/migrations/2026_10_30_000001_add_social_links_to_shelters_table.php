<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shelters', function (Blueprint $table) {
            $table->string('website')->nullable()->after('phone');
            $table->string('instagram')->nullable()->after('website');
            $table->string('facebook')->nullable()->after('instagram');
        });
    }

    public function down(): void
    {
        Schema::table('shelters', fn (Blueprint $table) => $table->dropColumn(['website', 'instagram', 'facebook']));
    }
};
