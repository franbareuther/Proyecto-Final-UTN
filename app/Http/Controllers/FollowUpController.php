<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\FollowUpCheckin;
use App\Models\FollowUpPhoto;
use App\Models\VaccinationCertificate;
use App\Services\FollowUpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class FollowUpController extends Controller
{
    private const IMAGE = ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'];

    private const MESSAGES = [
        'photos.*.required' => 'Falta la foto de esta situación.',
        'photos.*.image' => 'Elegí una imagen JPEG, PNG o WebP.',
        'photos.*.mimes' => 'Solo se admiten imágenes JPEG, PNG y WebP.',
        'photos.*.mimetypes' => 'Solo se admiten imágenes JPEG, PNG y WebP.',
        'photos.*.max' => 'Cada foto puede pesar hasta 5 MB.',
        'file.required' => 'Subí la foto de la hoja firmada por el veterinario.',
        'file.mimes' => 'Subí una imagen JPEG, PNG o WebP, o un PDF.',
        'file.mimetypes' => 'Subí una imagen JPEG, PNG o WebP, o un PDF.',
        'file.max' => 'El archivo puede pesar hasta 5 MB.',
        'vaccine_name.required' => 'Indicá qué vacuna se aplicó.',
        'application_date.required' => 'Indicá la fecha de aplicación.',
        'application_date.before_or_equal' => 'La fecha de aplicación no puede ser futura.',
    ];

    public function show(Adoption $adoption, FollowUpService $service)
    {
        Gate::authorize('followUp', $adoption);
        $service->schedule($adoption);

        return Inertia::render('FollowUp/Show', [
            'adoption' => $adoption->load(['animal.photos', 'animal.shelter', 'user:id,name,last_name,email',
                'checkins.photos', 'checkins.reviewer:id,name,last_name', 'certificates.uploader:id,name,last_name', 'certificates.reviewer:id,name,last_name']),
            'categories' => FollowUpService::CATEGORIES,
            'opensDaysBefore' => FollowUpService::OPENS_DAYS_BEFORE,
            'today' => today()->toDateString(),
            'canSubmit' => Gate::allows('submit', $adoption),
            'canReview' => Gate::allows('review', $adoption),
        ]);
    }

    public function submit(Request $request, Adoption $adoption, FollowUpCheckin $checkin, FollowUpService $service)
    {
        Gate::authorize('submit', $adoption);
        abort_unless($checkin->adoption_id === $adoption->id, 404);
        $rules = ['comment' => 'nullable|string|max:2000'];
        foreach (FollowUpService::CATEGORIES as $category) {
            $rules['photos.'.$category] = self::IMAGE;
        }
        $data = $request->validate($rules, self::MESSAGES);
        $service->submit($checkin, $request->file('photos'), $data['comment'] ?? null);

        return back()->with('success', '¡Gracias! El refugio va a recibir las fotos del control '.$checkin->sequence.'.');
    }

    public function review(Request $request, Adoption $adoption, FollowUpCheckin $checkin, FollowUpService $service)
    {
        Gate::authorize('review', $adoption);
        abort_unless($checkin->adoption_id === $adoption->id, 404);
        $data = $request->validate(['shelter_note' => 'nullable|string|max:2000']);
        $service->review($checkin, $request->user(), $data['shelter_note'] ?? null);

        return back()->with('success', 'Control marcado como revisado.');
    }

    public function storeCertificate(Request $request, Adoption $adoption, FollowUpService $service)
    {
        Gate::authorize('followUp', $adoption);
        $data = $request->validate([
            'vaccine_name' => 'required|string|max:255',
            'application_date' => 'required|date_format:Y-m-d|before_or_equal:today',
            'notes' => 'nullable|string|max:2000',
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'mimetypes:image/jpeg,image/png,image/webp,application/pdf', 'max:5120'],
        ], self::MESSAGES);
        $service->addCertificate($adoption, $request->user(), $data, $request->file('file'));

        return back()->with('success', 'Certificado de vacunación cargado.');
    }

    public function reviewCertificate(Adoption $adoption, VaccinationCertificate $certificate, FollowUpService $service, Request $request)
    {
        Gate::authorize('review', $adoption);
        abort_unless($certificate->adoption_id === $adoption->id, 404);
        $service->reviewCertificate($certificate, $request->user());

        return back()->with('success', 'Certificado marcado como revisado.');
    }

    public function photo(Adoption $adoption, FollowUpPhoto $photo, FollowUpService $service)
    {
        Gate::authorize('followUp', $adoption);
        abort_unless($photo->checkin->adoption_id === $adoption->id, 404);

        return $service->response($photo->file_path);
    }

    public function certificate(Adoption $adoption, VaccinationCertificate $certificate, FollowUpService $service)
    {
        Gate::authorize('followUp', $adoption);
        abort_unless($certificate->adoption_id === $adoption->id, 404);

        return $service->response($certificate->file_path);
    }
}
