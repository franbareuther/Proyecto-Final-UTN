<?php

// La marca visible no depende de APP_NAME para que .env locales antiguos no muestren otro nombre.
return ['demo_password' => env('DEMO_PASSWORD'), 'brand' => 'Huellita'];
