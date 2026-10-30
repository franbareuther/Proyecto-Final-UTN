<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Reloj de inactividad: arranca con un mensaje del refugio sin respuesta del adoptante.
        Schema::table('adoption_requests', function (Blueprint $t) {
            $t->timestamp('awaiting_reply_since')->nullable()->index();
            $t->foreignId('awaiting_reply_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->timestamp('inactivity_warned_at')->nullable();
        });
        Schema::create('adoption_messages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('adoption_request_id')->constrained()->restrictOnDelete();
            // Null en los avisos automáticos del sistema.
            $t->foreignId('user_id')->nullable()->constrained()->restrictOnDelete();
            $t->string('type', 20)->default('message');
            $t->text('body');
            $t->timestamps();
            $t->index(['adoption_request_id', 'id']);
        });
        Schema::create('follow_up_checkins', function (Blueprint $t) {
            $t->id();
            $t->foreignId('adoption_id')->constrained()->restrictOnDelete();
            $t->unsignedTinyInteger('sequence');
            $t->date('due_date');
            $t->timestamp('submitted_at')->nullable();
            $t->text('comment')->nullable();
            $t->timestamp('reviewed_at')->nullable();
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->text('shelter_note')->nullable();
            $t->timestamps();
            $t->unique(['adoption_id', 'sequence']);
        });
        Schema::create('follow_up_photos', function (Blueprint $t) {
            $t->id();
            $t->foreignId('follow_up_checkin_id')->constrained()->restrictOnDelete();
            $t->string('category', 20);
            $t->string('file_path');
            $t->timestamps();
            $t->unique(['follow_up_checkin_id', 'category']);
        });
        Schema::create('vaccination_certificates', function (Blueprint $t) {
            $t->id();
            $t->foreignId('adoption_id')->constrained()->restrictOnDelete();
            $t->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $t->string('vaccine_name');
            $t->date('application_date');
            $t->string('file_path');
            $t->text('notes')->nullable();
            $t->timestamp('reviewed_at')->nullable();
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vaccination_certificates');
        Schema::dropIfExists('follow_up_photos');
        Schema::dropIfExists('follow_up_checkins');
        Schema::dropIfExists('adoption_messages');
        Schema::table('adoption_requests', function (Blueprint $t) {
            $t->dropConstrainedForeignId('awaiting_reply_by');
            $t->dropIndex(['awaiting_reply_since']);
            $t->dropColumn(['awaiting_reply_since', 'inactivity_warned_at']);
        });
    }
};
