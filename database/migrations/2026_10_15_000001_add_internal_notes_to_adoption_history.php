<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('adoption_request_history', fn (Blueprint $table) => $table->text('internal_notes')->nullable());
    }

    public function down(): void
    {
        Schema::table('adoption_request_history', fn (Blueprint $table) => $table->dropColumn('internal_notes'));
    }
};
