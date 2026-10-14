<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['medical_consultations', 'vaccinations', 'treatments', 'veterinary_controls'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->renameColumn('veterinarian_id', 'recorded_by');
                $t->string('practitioner_name')->nullable();
                $t->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            });
            DB::table($table)->orderBy('id')->chunkById(200, function ($rows) use ($table) {
                $names = DB::table('users')->whereIn('id', $rows->pluck('recorded_by'))->get()->keyBy('id');
                foreach ($rows as $row) {
                    $person = $names->get($row->recorded_by);
                    DB::table($table)->where('id', $row->id)->update(['practitioner_name' => $person ? trim($person->name.' '.$person->last_name) : null]);
                }
            });
        }
        // Las cuentas existentes conservan su acceso y pertenencia al refugio.
        DB::table('users')->where('role', 'veterinario')->update(['role' => 'admin']);
    }

    public function down(): void
    {
        foreach (['medical_consultations', 'vaccinations', 'treatments', 'veterinary_controls'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropConstrainedForeignId('updated_by');
                $t->dropColumn('practitioner_name');
                $t->renameColumn('recorded_by', 'veterinarian_id');
            });
        }
        // No degradar administradores ni reconstruir roles sin evidencia de su origen.
    }
};
