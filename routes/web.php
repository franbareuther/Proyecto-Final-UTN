<?php

use App\Http\Controllers\AdoptionRequestController;
use App\Http\Controllers\AnimalController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FollowUpController;
use App\Http\Controllers\MedicalController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ShelterController;
use App\Http\Controllers\SuperadminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [CatalogController::class, 'home'])->name('home');
Route::get('/creditos-fotografias', function () {
    $photos = json_decode(file_get_contents(public_path('images/demo/refugios/creditos.json')), true, flags: JSON_THROW_ON_ERROR);
    $photos = array_map(function ($photo) {
        $photo['author'] = html_entity_decode(strip_tags($photo['authorHtml']), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return $photo;
    }, $photos);

    return Inertia::render('Public/PhotoCredits', ['photos' => $photos]);
})->name('photos.credits');
Route::post('/contacto', [ContactController::class, 'store'])->middleware('throttle:5,1')->name('contact.store');
Route::get('/animales', [CatalogController::class, 'all'])->name('catalog');
Route::middleware('guest')->group(function () {
    Route::get('/registro-refugio', [ShelterController::class, 'registerForm'])->name('shelters.register');
    Route::post('/registro-refugio', [ShelterController::class, 'register'])->middleware('throttle:5,1')->name('shelters.register.store');
});
Route::get('/refugios', [ShelterController::class, 'index'])->name('shelters.index');
Route::get('/refugios/{shelter}', [ShelterController::class, 'show'])->name('shelters.show');
Route::get('/refugios/{shelter}/animales', [CatalogController::class, 'index'])->name('shelters.catalog');
Route::get('/refugios/{shelter}/animales/{animal}', [CatalogController::class, 'scopedShow'])->name('shelters.animals.show');
Route::get('/animales/{animal}', [CatalogController::class, 'show'])->name('animals.show');
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn () => redirect(match (auth()->user()->role) {
        'superadmin' => '/superadmin', 'admin' => '/admin',default => '/mis-solicitudes'
    }))->name('dashboard');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::middleware('role:adoptante')->group(function () {
        Route::get('/mis-solicitudes', [AdoptionRequestController::class, 'mine'])->name('requests.mine');
        Route::get('/animales/{animal}/solicitar', [AdoptionRequestController::class, 'create'])->name('requests.create');
        Route::post('/animales/{animal}/solicitar', [AdoptionRequestController::class, 'store'])->middleware('throttle:20,1')->name('requests.store');
    });
    Route::get('/solicitudes/{adoptionRequest}', [AdoptionRequestController::class, 'show'])->name('requests.show');
    Route::middleware('role:admin,adoptante')->prefix('/chats')->controller(ChatController::class)->group(function () {
        Route::get('/', 'index')->name('chats.index');
        Route::get('/{adoptionRequest}', 'show')->name('chats.show');
        Route::post('/{adoptionRequest}/mensajes', 'store')->middleware('throttle:30,1')->name('chats.messages.store');
    });
    Route::prefix('/adopciones/{adoption}')->controller(FollowUpController::class)->group(function () {
        Route::get('/seguimiento', 'show')->name('followups.show');
        Route::post('/seguimiento/{checkin}', 'submit')->middleware('throttle:20,1')->name('followups.submit');
        Route::patch('/seguimiento/{checkin}', 'review')->name('followups.review');
        Route::post('/certificados', 'storeCertificate')->middleware('throttle:20,1')->name('followups.certificates.store');
        Route::patch('/certificados/{certificate}', 'reviewCertificate')->name('followups.certificates.review');
        Route::get('/archivos/fotos/{photo}', 'photo')->name('followups.photo');
        Route::get('/archivos/certificados/{certificate}', 'certificate')->name('followups.certificate');
    });
    Route::middleware('role:superadmin')->prefix('superadmin')->group(function () {
        Route::get('/', [SuperadminController::class, 'dashboard'])->name('superadmin.dashboard');
        foreach (['animales', 'solicitudes', 'adopciones', 'controles', 'dosis'] as $view) {
            Route::get('/'.$view, [SuperadminController::class, 'index'])->defaults('view', $view)->name('superadmin.'.$view);
        }
        Route::get('/animales/{animal}/historia', [SuperadminController::class, 'history'])->withTrashed()->name('superadmin.history');
        Route::get('/solicitudes/{adoptionRequest}', [SuperadminController::class, 'application'])->name('superadmin.application');
        Route::get('/mensajes', [ContactController::class, 'index'])->name('superadmin.messages');
        Route::get('/refugios', [ShelterController::class, 'manage'])->name('superadmin.shelters');
        Route::post('/refugios', [ShelterController::class, 'store'])->name('superadmin.shelters.store');
        Route::patch('/refugios/{shelter}', [ShelterController::class, 'update'])->name('superadmin.shelters.update');
        Route::post('/refugios/{shelter}/personal', [ShelterController::class, 'staff'])->name('superadmin.staff.store');
    });
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::match(['get', 'patch'], '/refugio', [ShelterController::class, 'profile'])->name('admin.shelter');
        Route::get('/', DashboardController::class)->name('admin.dashboard');
        Route::resource('animales', AnimalController::class)->parameters(['animales' => 'animal'])->except('show')->names('admin.animals');
        Route::delete('/animales/{animal}/fotos/{photo}', [AnimalController::class, 'deletePhoto'])->name('admin.photos.delete');
        Route::patch('/animales/{animal}/fotos/{photo}', [AnimalController::class, 'primaryPhoto'])->name('admin.photos.primary');
        Route::get('/solicitudes', [AdoptionRequestController::class, 'index'])->name('admin.requests');
        Route::patch('/solicitudes/{adoptionRequest}', [AdoptionRequestController::class, 'update'])->name('admin.requests.update');
        Route::get('/adopciones', [AdoptionRequestController::class, 'adoptions'])->name('admin.adoptions');
    });
    Route::middleware('role:admin')->group(function () {
        Route::get('/veterinaria', [MedicalController::class, 'index'])->name('medical.index');
        Route::get('/veterinaria/controles', [MedicalController::class, 'controls'])->name('medical.controls');
        Route::get('/veterinaria/{animal}', [MedicalController::class, 'show'])->withTrashed()->name('medical.show');
        Route::post('/veterinaria/{animal}/dosis/{dose}/{action}', [MedicalController::class, 'resolveDose'])->whereIn('action', ['apply', 'cancel'])->name('medical.doses.resolve');
        Route::post('/veterinaria/{animal}/{type}', [MedicalController::class, 'store'])->middleware('role:admin')->name('medical.store');
        Route::patch('/veterinaria/{animal}/{type}/{record}', [MedicalController::class, 'update'])->middleware('role:admin')->name('medical.update');
    });
});
require __DIR__.'/auth.php';
