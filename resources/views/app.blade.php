<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Huellitas') }}</title>

        <!-- Fonts -->
        <link rel="preload" href="{{ Vite::asset('resources/fonts/plus-jakarta-sans-latin-variable.woff2') }}" as="font" type="font/woff2" crossorigin>
        <link rel="preload" href="{{ Vite::asset('resources/fonts/bricolage-grotesque-latin-variable.woff2') }}" as="font" type="font/woff2" crossorigin>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
