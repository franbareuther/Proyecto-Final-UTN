import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Application, Shared } from '@/types/shelter';
import { Badge, Confirm, date, Errors, Field, Shell, Title } from '@/Components/Shelter';
import AnimalImage from '@/Components/AnimalImage';
import { adoptionSteps } from './adoptionSteps';
export default function RequestDetail({ application: r }: { application: Application }) {
    const admin = usePage<Shared>().props.auth.user?.role === 'admin';
    const f = useForm({ status: '', observations: '', internal_notes: '' });
    const options: Record<string, string[]> = {
        Nueva: ['En revisión', 'Aprobada', 'Rechazada'],
        'En revisión': ['Aprobada', 'Rechazada'],
        Aprobada: ['Adoptado', 'Rechazada'],
    };
    const allowedOptions = (options[r.status] || []).filter((next) =>
        next === 'Aprobada'
            ? r.animal.availability_status === 'Disponible'
            : next === 'Adoptado'
              ? r.animal.availability_status === 'En proceso de adopción'
              : true,
    );
    return (
        <Shell internal={admin}>
            <Head title={`Solicitud #${r.id}`} />
            <Title title={`Solicitud #${r.id}`} text={`Presentada el ${date(r.created_at)}`}>
                <Badge>{r.status}</Badge>
            </Title>
            <p
                className="mb-6 max-w-3xl rounded-xl bg-emerald-50 p-4 text-emerald-950"
                role="status"
            >
                {adoptionSteps[r.status]}
            </p>
            <Link
                className="text-link mb-6"
                href={admin ? '/admin/solicitudes' : '/mis-solicitudes'}
            >
                ← Volver a las solicitudes
            </Link>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="card flex flex-wrap items-center gap-5">
                        <AnimalImage
                            src={r.animal.photo_url}
                            alt={r.animal.name}
                            className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 break-words">
                            <h2 className="text-2xl font-semibold">{r.animal.name}</h2>
                            <p className="mt-2 text-sm font-semibold text-emerald-800">
                                {r.animal.shelter?.name}
                            </p>
                            {r.animal.shelter?.active === false && (
                                <p className="mt-2 text-sm text-stone-700">
                                    El refugio está inactivo. Tu solicitud y su historial se
                                    conservan.
                                </p>
                            )}
                            <p className="mt-1 text-stone-500">
                                {r.user.name} {r.user.last_name}
                            </p>
                            <p className="text-sm text-stone-500">{r.user.email}</p>
                        </div>
                    </div>
                    <dl className="card grid gap-6 sm:grid-cols-2">
                        {[
                            ['Teléfono', r.phone],
                            ['Domicilio', r.address],
                            ['Vivienda', r.housing_type],
                            ['Otros animales', r.has_other_pets ? 'Sí' : 'No'],
                            ['Experiencia', r.previous_experience],
                            ['Motivación', r.motivation],
                            [
                                'Información adicional',
                                r.additional_information || 'Sin información adicional',
                            ],
                        ].map(([label, v]) => (
                            <div key={label}>
                                <dt className="text-sm text-stone-500">{label}</dt>
                                <dd className="mt-1 whitespace-pre-wrap break-words">{v}</dd>
                            </div>
                        ))}
                    </dl>
                    {admin && allowedOptions.length > 0 && (
                        <div className="card space-y-5">
                            <h2 className="text-xl font-semibold">Evaluar solicitud</h2>
                            <Errors errors={f.errors} />
                            <Field label="Nuevo estado" error={f.errors.status}>
                                <select
                                    value={f.data.status}
                                    onChange={(e) => f.setData('status', e.target.value)}
                                >
                                    <option value="">Seleccionar acción</option>
                                    {allowedOptions.map((x) => (
                                        <option key={x} value={x}>
                                            {x === 'Adoptado'
                                                ? 'Registrar adopción definitiva'
                                                : x === 'Aprobada'
                                                  ? 'Aprobar y reservar'
                                                  : x}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Motivo / próximos pasos (visible para el adoptante)"
                                error={f.errors.observations}
                            >
                                <textarea
                                    rows={3}
                                    maxLength={2000}
                                    value={f.data.observations}
                                    onChange={(e) => f.setData('observations', e.target.value)}
                                />
                            </Field>
                            <Field
                                label="Nota interna (opcional, solo personal del refugio)"
                                error={f.errors.internal_notes}
                            >
                                <textarea
                                    rows={3}
                                    maxLength={2000}
                                    value={f.data.internal_notes}
                                    onChange={(e) => f.setData('internal_notes', e.target.value)}
                                />
                            </Field>
                            <p className="text-sm text-stone-600">
                                Elegí un estado y escribí un motivo de al menos 5 caracteres para
                                habilitar la confirmación. No incluyas datos sensibles en el motivo
                                visible.
                            </p>
                            <p className="text-sm text-stone-500">
                                Al registrar Adoptado se crea la adopción definitiva y se cierran
                                las otras solicitudes pendientes con un motivo visible en su
                                historial.
                            </p>
                            <Confirm
                                label={f.processing ? 'Guardando…' : 'Registrar decisión'}
                                title="Confirmar cambio de estado"
                                busy={
                                    f.processing ||
                                    !f.data.status ||
                                    f.data.observations.trim().length < 5
                                }
                                onConfirm={() =>
                                    f.patch('/admin/solicitudes/' + r.id, {
                                        onSuccess: () => f.reset(),
                                    })
                                }
                            >
                                <p>
                                    Vas a cambiar la solicitud a{' '}
                                    <strong>{f.data.status || '(seleccioná un estado)'}</strong>. La
                                    aprobación reserva el animal; Adoptado registra la adopción
                                    definitiva.
                                </p>
                            </Confirm>
                        </div>
                    )}
                </div>
                <section className="card self-start">
                    <h2 className="mb-6 text-xl font-semibold">Historial del proceso</h2>
                    <ol className="space-y-6 border-l border-emerald-200 pl-5">
                        {r.history.map((h) => (
                            <li key={h.id}>
                                <Badge>{h.new_status}</Badge>
                                <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                                    {h.observations}
                                </p>
                                {admin && h.internal_notes && (
                                    <div className="mt-3 rounded-lg bg-stone-100 p-3 text-sm">
                                        <p className="font-semibold">Nota interna del refugio</p>
                                        <p className="mt-1 whitespace-pre-wrap break-words">
                                            {h.internal_notes}
                                        </p>
                                    </div>
                                )}
                                <p className="mt-2 text-xs text-stone-500">
                                    {date(h.created_at)}{' '}
                                    {admin && h.actor && `· ${h.actor.name} ${h.actor.last_name}`}
                                </p>
                            </li>
                        ))}
                    </ol>
                </section>
            </div>
        </Shell>
    );
}
