<?php

use App\Http\Controllers\AdoptionRequestController;
use App\Http\Controllers\AnimalController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MedicalController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', [CatalogController::class, 'home'])->name('home');
Route::get('/animales', [CatalogController::class, 'index'])->name('catalog');
Route::get('/animales/{animal}', [CatalogController::class, 'show'])->name('animals.show');
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn () => redirect(match (auth()->user()->role) {
        'admin' => '/admin','veterinario' => '/veterinaria',default => '/mis-solicitudes'
    }))->name('dashboard');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::middleware('role:adoptante')->group(function () {
        Route::get('/mis-solicitudes', [AdoptionRequestController::class, 'mine'])->name('requests.mine');
        Route::get('/animales/{animal}/solicitar', [AdoptionRequestController::class, 'create'])->name('requests.create');
        Route::post('/animales/{animal}/solicitar', [AdoptionRequestController::class, 'store'])->middleware('throttle:20,1')->name('requests.store');
    });
    Route::get('/solicitudes/{adoptionRequest}', [AdoptionRequestController::class, 'show'])->name('requests.show');
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/', DashboardController::class)->name('admin.dashboard');
        Route::resource('animales', AnimalController::class)->parameters(['animales' => 'animal'])->except('show')->names('admin.animals');
        Route::delete('/animales/{animal}/fotos/{photo}', [AnimalController::class, 'deletePhoto'])->name('admin.photos.delete');
        Route::patch('/animales/{animal}/fotos/{photo}', [AnimalController::class, 'primaryPhoto'])->name('admin.photos.primary');
        Route::get('/solicitudes', [AdoptionRequestController::class, 'index'])->name('admin.requests');
        Route::patch('/solicitudes/{adoptionRequest}', [AdoptionRequestController::class, 'update'])->name('admin.requests.update');
        Route::get('/adopciones', [AdoptionRequestController::class, 'adoptions'])->name('admin.adoptions');
    });
    Route::middleware('role:admin,veterinario')->group(function () {
        Route::get('/veterinaria', [MedicalController::class, 'index'])->name('medical.index');
        Route::get('/veterinaria/controles', [MedicalController::class, 'controls'])->name('medical.controls');
        Route::get('/veterinaria/{animal}', [MedicalController::class, 'show'])->name('medical.show');
        Route::post('/veterinaria/{animal}/{type}', [MedicalController::class, 'store'])->middleware('role:veterinario')->name('medical.store');
        Route::patch('/veterinaria/{animal}/{type}/{record}', [MedicalController::class, 'update'])->middleware('role:veterinario')->name('medical.update');
    });
});
require __DIR__.'/auth.php';
