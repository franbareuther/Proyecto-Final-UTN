import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useRef } from 'react';
import { Adoption, FollowUpCheckin, VaccinationCertificate } from '@/types/shelter';
import { Badge, date, Errors, Field, Shell, Title } from '@/Components/Shelter';
import { openChat } from '@/Components/ChatBubble';

type FollowUpAdoption = Adoption & {
    adoption_request_id: number;
    checkins: FollowUpCheckin[];
    certificates: VaccinationCertificate[];
};
const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const prompts: Record<string, string> = {
    Jugando: 'Un momento de juego',
    Durmiendo: 'Dónde y cómo descansa',
    Comiendo: 'A la hora de comer',
    Convivencia: 'Con la familia u otros animales',
};
const period = (sequence: number) => (sequence <= 4 ? `Semana ${sequence}` : `Mes ${sequence - 3}`);

function status(checkin: FollowUpCheckin, today: string, opensDaysBefore: number) {
    if (checkin.reviewed_at) return 'Revisado';
    if (checkin.submitted_at) return 'Enviado';
    if (checkin.due_date < today) return 'Vencido';
    const opens = new Date(checkin.due_date + 'T12:00:00');
    opens.setDate(opens.getDate() - opensDaysBefore);
    return opens.toISOString().slice(0, 10) <= today ? 'Pendiente' : 'Próximo';
}

function CheckinForm({
    adoptionId,
    checkin,
    categories,
}: {
    adoptionId: number;
    checkin: FollowUpCheckin;
    categories: string[];
}) {
    const f = useForm({
        photos: Object.fromEntries(categories.map((c) => [c, null])) as Record<string, File | null>,
        comment: '',
    });
    const errors = f.errors as Record<string, string>;
    const submit = (e: FormEvent) => {
        e.preventDefault();
        // Validación inmediata; el servidor vuelve a validar tipo y tamaño.
        const local: Record<string, string> = {};
        categories.forEach((c) => {
            const file = f.data.photos[c];
            if (!file) local[`photos.${c}`] = 'Falta la foto de esta situación.';
            else if (!imageTypes.includes(file.type))
                local[`photos.${c}`] = 'Elegí una imagen JPEG, PNG o WebP.';
            else if (file.size > 5 * 1024 * 1024)
                local[`photos.${c}`] = 'Cada foto puede pesar hasta 5 MB.';
        });
        f.clearErrors();
        if (Object.keys(local).length) {
            f.setError(local as never);
            return;
        }
        f.post(`/adopciones/${adoptionId}/seguimiento/${checkin.id}`, {
            forceFormData: true,
            preserveScroll: true,
        });
    };
    return (
        <form onSubmit={submit} className="mt-4 space-y-4 border-t border-stone-100 pt-4">
            <Errors errors={errors} />
            <div className="grid gap-4 sm:grid-cols-2">
                {categories.map((c) => (
                    <Field
                        key={c}
                        label={`${c} · ${prompts[c] || ''}`}
                        error={errors[`photos.${c}`]}
                    >
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            required
                            className="block w-full min-w-0 text-sm"
                            onChange={(e) =>
                                f.setData('photos', {
                                    ...f.data.photos,
                                    [c]: e.target.files?.[0] || null,
                                })
                            }
                        />
                    </Field>
                ))}
            </div>
            <Field label="¿Cómo viene la adaptación? (opcional)" error={errors.comment}>
                <textarea
                    rows={2}
                    maxLength={2000}
                    value={f.data.comment}
                    onChange={(e) => f.setData('comment', e.target.value)}
                />
            </Field>
            <button className="btn" disabled={f.processing}>
                {f.processing ? 'Enviando fotos…' : `Enviar control ${checkin.sequence}`}
            </button>
        </form>
    );
}

function ReviewForm({ adoptionId, checkin }: { adoptionId: number; checkin: FollowUpCheckin }) {
    const f = useForm({ shelter_note: '' });
    return (
        <form
            className="mt-4 space-y-3 border-t border-stone-100 pt-4"
            onSubmit={(e) => {
                e.preventDefault();
                f.patch(`/adopciones/${adoptionId}/seguimiento/${checkin.id}`, {
                    preserveScroll: true,
                });
            }}
        >
            <Field label="Comentario para la familia (opcional)" error={f.errors.shelter_note}>
                <textarea
                    rows={2}
                    maxLength={2000}
                    value={f.data.shelter_note}
                    onChange={(e) => f.setData('shelter_note', e.target.value)}
                />
            </Field>
            <button className="btn-secondary" disabled={f.processing}>
                Marcar como revisado
            </button>
        </form>
    );
}

function CertificateForm({ adoptionId, today }: { adoptionId: number; today: string }) {
    const f = useForm({
        vaccine_name: '',
        application_date: '',
        notes: '',
        file: null as File | null,
    });
    const input = useRef<HTMLInputElement>(null);
    return (
        <form
            className="space-y-4"
            onSubmit={(e) => {
                e.preventDefault();
                f.post(`/adopciones/${adoptionId}/certificados`, {
                    forceFormData: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        f.reset();
                        if (input.current) input.current.value = '';
                    },
                });
            }}
        >
            <Errors errors={f.errors} />
            <Field label="Vacuna aplicada" error={f.errors.vaccine_name}>
                <input
                    required
                    maxLength={255}
                    value={f.data.vaccine_name}
                    onChange={(e) => f.setData('vaccine_name', e.target.value)}
                />
            </Field>
            <Field label="Fecha de aplicación" error={f.errors.application_date}>
                <input
                    type="date"
                    required
                    max={today}
                    value={f.data.application_date}
                    onChange={(e) => f.setData('application_date', e.target.value)}
                />
            </Field>
            <Field label="Foto de la hoja firmada por el veterinario" error={f.errors.file}>
                <input
                    ref={input}
                    type="file"
                    required
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="block w-full min-w-0 text-sm"
                    onChange={(e) => f.setData('file', e.target.files?.[0] || null)}
                />
            </Field>
            <Field label="Observaciones (opcional)" error={f.errors.notes}>
                <textarea
                    rows={2}
                    maxLength={2000}
                    value={f.data.notes}
                    onChange={(e) => f.setData('notes', e.target.value)}
                />
            </Field>
            <button className="btn w-full" disabled={f.processing}>
                {f.processing ? 'Subiendo…' : 'Cargar certificado'}
            </button>
        </form>
    );
}

export default function Show({
    adoption: a,
    categories,
    opensDaysBefore,
    today,
    canSubmit,
    canReview,
}: {
    adoption: FollowUpAdoption;
    categories: string[];
    opensDaysBefore: number;
    today: string;
    canSubmit: boolean;
    canReview: boolean;
}) {
    const sent = a.checkins.filter((c) => c.submitted_at).length;
    const file = (kind: 'fotos' | 'certificados', id: number) =>
        `/adopciones/${a.id}/archivos/${kind}/${id}`;
    return (
        <Shell internal={canReview}>
            <Head title={`Seguimiento de ${a.animal.name}`} />
            <Title
                title={`Seguimiento de ${a.animal.name}`}
                text={`Adoptado por ${a.user.name} ${a.user.last_name} el ${date(a.adoption_date)}. El primer mes se comparte un control por semana y después uno por mes, hasta los seis meses.`}
            >
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => openChat(a.adoption_request_id)}
                >
                    Abrir chat
                </button>
            </Title>
            <div className="mb-6">
                <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-emerald-950">Controles enviados</span>
                    <strong>
                        {sent} de {a.checkins.length}
                    </strong>
                </div>
                <div className="h-2 rounded-full bg-stone-200">
                    <div
                        className="h-2 rounded-full bg-emerald-700"
                        style={{ width: `${(100 * sent) / Math.max(1, a.checkins.length)}%` }}
                    />
                </div>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <section aria-labelledby="checkins-title" className="space-y-4">
                    <h2 id="checkins-title" className="text-xl font-semibold">
                        Controles
                    </h2>
                    {a.checkins.map((c) => {
                        const state = status(c, today, opensDaysBefore);
                        const open =
                            !c.submitted_at && (state === 'Pendiente' || state === 'Vencido');
                        return (
                            <article key={c.id} className="card">
                                <div className="flex flex-wrap items-baseline justify-between gap-3">
                                    <h3 className="font-semibold text-emerald-950">
                                        Control {c.sequence} · {period(c.sequence)}
                                    </h3>
                                    <Badge>{state}</Badge>
                                </div>
                                <p className="mt-1 text-sm text-stone-600">
                                    {c.submitted_at
                                        ? `Enviado el ${date(c.submitted_at)} · previsto para el ${date(c.due_date)}`
                                        : `Previsto para el ${date(c.due_date)}`}
                                </p>
                                {c.photos.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {c.photos.map((p) => (
                                            <figure key={p.id} className="min-w-0">
                                                <a
                                                    href={file('fotos', p.id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <img
                                                        src={file('fotos', p.id)}
                                                        alt={`${a.animal.name}: ${p.category.toLowerCase()}`}
                                                        className="aspect-square w-full rounded-xl object-cover"
                                                        loading="lazy"
                                                    />
                                                </a>
                                                <figcaption className="mt-1 text-xs font-medium text-stone-600">
                                                    {p.category}
                                                </figcaption>
                                            </figure>
                                        ))}
                                    </div>
                                )}
                                {c.comment && (
                                    <p className="mt-3 whitespace-pre-wrap break-words text-sm text-stone-700">
                                        “{c.comment}”
                                    </p>
                                )}
                                {c.reviewed_at && (
                                    <p className="mt-3 text-sm text-emerald-900">
                                        Revisado por {c.reviewer?.name} {c.reviewer?.last_name}
                                        {c.shelter_note ? `: ${c.shelter_note}` : '.'}
                                    </p>
                                )}
                                {canSubmit && open && (
                                    <CheckinForm
                                        adoptionId={a.id}
                                        checkin={c}
                                        categories={categories}
                                    />
                                )}
                                {canSubmit && state === 'Próximo' && (
                                    <p className="mt-3 text-xs text-stone-500">
                                        Se habilita {opensDaysBefore} días antes de la fecha
                                        prevista.
                                    </p>
                                )}
                                {canReview && c.submitted_at && !c.reviewed_at && (
                                    <ReviewForm adoptionId={a.id} checkin={c} />
                                )}
                            </article>
                        );
                    })}
                </section>
                <aside
                    aria-labelledby="certificates-title"
                    className="space-y-4 lg:sticky lg:top-6"
                >
                    <section className="card space-y-4">
                        <div>
                            <h2 id="certificates-title" className="text-xl font-semibold">
                                Vacunas
                            </h2>
                            <p className="mt-1 text-sm text-stone-600">
                                Cargá la foto de la hoja donde el veterinario firma cada vacuna
                                aplicada.
                            </p>
                        </div>
                        {a.certificates.length ? (
                            <ul className="divide-y divide-stone-100">
                                {a.certificates.map((v) => (
                                    <li key={v.id} className="py-3 text-sm">
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <strong className="break-words">
                                                {v.vaccine_name}
                                            </strong>
                                            <Badge>{v.reviewed_at ? 'Revisado' : 'Enviado'}</Badge>
                                        </div>
                                        <p className="text-stone-600">
                                            Aplicada el {date(v.application_date)}
                                        </p>
                                        {v.notes && (
                                            <p className="mt-1 whitespace-pre-wrap break-words text-stone-700">
                                                {v.notes}
                                            </p>
                                        )}
                                        <div className="mt-2 flex flex-wrap gap-3">
                                            <a
                                                className="text-link"
                                                href={file('certificados', v.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Ver certificado
                                            </a>
                                            {canReview && !v.reviewed_at && (
                                                <button
                                                    type="button"
                                                    className="text-link"
                                                    onClick={() =>
                                                        router.patch(
                                                            `/adopciones/${a.id}/certificados/${v.id}`,
                                                            {},
                                                            { preserveScroll: true },
                                                        )
                                                    }
                                                >
                                                    Marcar como revisado
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-stone-500">
                                Todavía no se cargaron certificados.
                            </p>
                        )}
                    </section>
                    {(canSubmit || canReview) && (
                        <section className="card">
                            <h3 className="mb-4 font-semibold">Nuevo certificado</h3>
                            <CertificateForm adoptionId={a.id} today={today} />
                        </section>
                    )}
                </aside>
            </div>
        </Shell>
    );
}
