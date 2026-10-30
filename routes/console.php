<?php

use App\Services\AdoptionChatService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('adoptions:expire-inactive', function (AdoptionChatService $chat) {
    $this->info('Solicitudes revisadas: '.$chat->enforceDue());
})->purpose('Avisa a las 24 h y finaliza a las 48 h las solicitudes sin respuesta del adoptante en el chat');

// Las vistas de solicitudes también aplican los plazos, por si el programador no está en ejecución.
Schedule::command('adoptions:expire-inactive')->everyFifteenMinutes()->withoutOverlapping();
