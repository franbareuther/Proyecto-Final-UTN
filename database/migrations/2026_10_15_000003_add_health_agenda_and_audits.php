<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vaccination_doses', function (Blueprint $t) {
            $t->id();
            $t->foreignId('animal_id')->constrained()->restrictOnDelete();
            $t->foreignId('source_vaccination_id')->unique()->constrained('vaccinations')->restrictOnDelete();
            $t->foreignId('application_vaccination_id')->nullable()->unique()->constrained('vaccinations')->restrictOnDelete();
            $t->date('scheduled_date')->index();
            $t->string('status', 20)->default('Pendiente')->index();
            $t->boolean('legacy_unverified')->default(false);
            $t->text('cancellation_reason')->nullable();
            $t->foreignId('resolved_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->timestamp('resolved_at')->nullable();
            $t->timestamps();
        });
        Schema::create('health_audits', function (Blueprint $t) {
            $t->id();
            $t->foreignId('animal_id')->constrained()->restrictOnDelete();
            $t->string('record_type', 30);
            $t->unsignedBigInteger('record_id');
            $t->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $t->string('action', 30);
            $t->json('before_values');
            $t->json('after_values');
            $t->timestamp('created_at');
            $t->index(['animal_id', 'record_type', 'record_id']);
        });
        DB::table('vaccinations')->whereNotNull('next_dose_date')->orderBy('id')->chunkById(500, function ($records) {
            foreach ($records as $record) {
                DB::table('vaccination_doses')->insert([
                    'animal_id' => $record->animal_id, 'source_vaccination_id' => $record->id,
                    'scheduled_date' => $record->next_dose_date, 'status' => 'Pendiente',
                    'legacy_unverified' => true, 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_audits');
        Schema::dropIfExists('vaccination_doses');
    }
};
