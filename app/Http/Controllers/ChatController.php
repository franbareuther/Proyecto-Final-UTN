<?php

namespace App\Http\Controllers;

use App\Models\AdoptionRequest;
use App\Services\AdoptionChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

// API de la burbuja de chat: responde JSON para conversar sin salir de la página actual.
class ChatController extends Controller
{
    public function index(Request $request, AdoptionChatService $chat)
    {
        $conversations = $chat->inbox($request->user());

        return response()->json(['conversations' => $conversations, 'unread' => $conversations->sum('unread')]);
    }

    public function show(Request $request, AdoptionRequest $adoptionRequest, AdoptionChatService $chat)
    {
        // Solo el adoptante de la solicitud y el personal del refugio responsable.
        Gate::authorize('view', $adoptionRequest);

        return response()->json($chat->conversation($adoptionRequest, $request->user()));
    }

    public function store(Request $request, AdoptionRequest $adoptionRequest, AdoptionChatService $chat)
    {
        Gate::authorize('view', $adoptionRequest);
        $data = $request->validate(['body' => 'required|string|max:2000'], [
            'body.required' => 'Escribí un mensaje antes de enviarlo.',
            'body.max' => 'El mensaje no puede superar los :max caracteres.',
        ]);
        $chat->post($adoptionRequest, $request->user(), trim($data['body']));

        return response()->json($chat->conversation($adoptionRequest, $request->user()));
    }
}
