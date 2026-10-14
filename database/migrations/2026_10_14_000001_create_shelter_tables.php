<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->string('last_name')->default('');
            $t->enum('role', ['adoptante', 'admin', 'veterinario'])->default('adoptante')->index();
        });
        Schema::create('animals', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('species')->index();
            $t->string('breed')->nullable();
            $t->enum('sex', ['Macho', 'Hembra']);
            $t->date('birth_date')->nullable();
            $t->unsignedSmallInteger('estimated_age')->nullable()->comment('Edad estimada en meses');
            $t->enum('size', ['Pequeño', 'Mediano', 'Grande']);
            $t->string('color');
            $t->text('description');
            $t->text('personality')->nullable();
            $t->date('entry_date');
            $t->enum('availability_status', ['Disponible', 'En proceso de adopción', 'Adoptado', 'No disponible temporalmente'])->default('Disponible')->index();
            $t->text('public_health_info')->nullable();
            $t->timestamps();
            $t->softDeletes();
        });
        Schema::create('animal_photos', function (Blueprint $t) {
            $t->id();
            $t->foreignId('animal_id')->constrained()->restrictOnDelete();
            $t->string('file_path');
            $t->boolean('is_primary')->default(false);
            $t->timestamps();
        });
        Schema::create('adoption_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->foreignId('animal_id')->constrained()->restrictOnDelete();
            $t->string('phone');
            $t->string('address');
            $t->string('housing_type');
            $t->boolean('has_other_pets');
            $t->text('previous_experience');
            $t->text('motivation');
            $t->text('additional_information')->nullable();
            $t->enum('status', ['Nueva', 'En revisión', 'Aprobada', 'Rechazada', 'Adoptado'])->default('Nueva')->index();
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->timestamp('reviewed_at')->nullable();
            $t->timestamps();
            $t->index(['animal_id', 'user_id', 'status']);
        });
        Schema::create('adoptions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('adoption_request_id')->unique()->constrained()->restrictOnDelete();
            $t->foreignId('animal_id')->unique()->constrained()->restrictOnDelete();
            $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->date('adoption_date');
            $t->foreignId('registered_by')->constrained('users')->restrictOnDelete();
            $t->timestamps();
        });
        Schema::create('adoption_request_history', function (Blueprint $t) {
            $t->id();
            $t->foreignId('adoption_request_id')->constrained()->restrictOnDelete();
            $t->foreignId('changed_by')->constrained('users')->restrictOnDelete();
            $t->string('previous_status')->nullable();
            $t->string('new_status');
            $t->text('observations');
            $t->timestamps();
        });
        foreach (['medical_consultations', 'vaccinations', 'treatments', 'veterinary_controls'] as $table) {
            Schema::create($table, function (Blueprint $t) use ($table) {
                $t->id();
                $t->foreignId('animal_id')->constrained()->restrictOnDelete();
                $t->foreignId('veterinarian_id')->constrained('users')->restrictOnDelete();
                if ($table === 'medical_consultations') {
                    $t->date('consultation_date');
                    $t->string('reason');
                    $t->text('symptoms')->nullable();
                    $t->text('diagnosis');
                    $t->text('instructions')->nullable();
                } elseif ($table === 'vaccinations') {
                    $t->string('vaccine_name');
                    $t->date('application_date');
                    $t->string('dose')->nullable();
                    $t->date('next_dose_date')->nullable()->index();
                } elseif ($table === 'treatments') {
                    $t->text('description');
                    $t->date('start_date');
                    $t->date('estimated_end_date')->nullable();
                    $t->enum('status', ['Activo', 'Finalizado', 'Suspendido'])->default('Activo');
                } else {
                    $t->string('control_type');
                    $t->date('scheduled_date')->index();
                    $t->enum('status', ['Pendiente', 'Realizado', 'Cancelado'])->default('Pendiente');
                }
                $t->text('observations')->nullable();
                $t->timestamps();
            });
        }
    }

    public function down(): void
    {
        foreach (['veterinary_controls', 'treatments', 'vaccinations', 'medical_consultations', 'adoption_request_history', 'adoptions', 'adoption_requests', 'animal_photos', 'animals'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn(['last_name', 'role']));
    }
};
