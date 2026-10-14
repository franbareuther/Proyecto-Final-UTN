import { Head, useForm, usePage } from '@inertiajs/react';
import { Application, Shared } from '@/types/shelter';
import { Badge, Confirm, date, Errors, Field, Shell, Title } from '@/Components/Shelter';
export default function RequestDetail({ application: r }: { application: Application }) {
    const admin = usePage<Shared>().props.auth.user?.role === 'admin';
    const f = useForm({ status: '', observations: '' });
    const options: Record<string, string[]> = {
        Nueva: ['En revisión', 'Aprobada', 'Rechazada'],
        'En revisión': ['Aprobada', 'Rechazada'],
        Aprobada: ['Adoptado', 'Rechazada'],
    };
    return (
        <Shell internal={admin}>
            <Head title={`Solicitud #${r.id}`} />
            <Title title={`Solicitud #${r.id}`} text={`Presentada el ${date(r.created_at)}`}>
                <Badge>{r.status}</Badge>
            </Title>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="card flex items-center gap-5">
                        <img
                            src={r.animal.photo_url}
                            alt={r.animal.name}
                            className="h-24 w-24 rounded-2xl object-cover"
                        />
                        <div>
                            <h2 className="text-2xl font-semibold">{r.animal.name}</h2>
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
                    {admin && options[r.status] && (
                        <div className="card space-y-5">
                            <h2 className="text-xl font-semibold">Evaluar solicitud</h2>
                            <Errors errors={f.errors} />
                            <Field label="Nuevo estado">
                                <select
                                    value={f.data.status}
                                    onChange={(e) => f.setData('status', e.target.value)}
                                >
                                    <option value="">Seleccionar acción</option>
                                    {options[r.status].map((x) => (
                                        <option key={x}>{x}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Motivo / resultado (visible para el adoptante)">
                                <textarea
                                    rows={3}
                                    value={f.data.observations}
                                    onChange={(e) => f.setData('observations', e.target.value)}
                                />
                            </Field>
                            <p className="text-sm text-stone-500">
                                Al registrar Adoptado se crea la adopción definitiva y se cierran
                                las otras solicitudes pendientes con un motivo visible en su
                                historial.
                            </p>
                            <Confirm
                                label={f.processing ? 'Guardando…' : 'Registrar decisión'}
                                title="Confirmar cambio de estado"
                                busy={f.processing}
                                onConfirm={() => f.patch('/admin/solicitudes/' + r.id)}
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
                                <p className="mt-2 whitespace-pre-wrap text-sm">{h.observations}</p>
                                <p className="mt-2 text-xs text-stone-500">
                                    {date(h.created_at)} · {h.actor.name} {h.actor.last_name}
                                </p>
                            </li>
                        ))}
                    </ol>
                </section>
            </div>
        </Shell>
    );
}
