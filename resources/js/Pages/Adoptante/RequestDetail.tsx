import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Application, Shared } from '@/types/shelter';
import { Badge, Confirm, date, Errors, Field, Shell, Title } from '@/Components/Shelter';
import { openChat } from '@/Components/ChatBubble';
import Icon from '@/Components/Icon';
export default function RequestDetail({
    application: r,
    chatDeadline = null,
}: {
    application: Application;
    chatDeadline?: string | null;
}) {
    const role = usePage<Shared>().props.auth.user?.role;
    const admin = role === 'admin';
    // El superadmin supervisa la red pero no participa de la conversación privada.
    const canChat = admin || role === 'adoptante';
    const f = useForm({ status: '', observations: '' });
    const options: Record<string, string[]> = {
        Nueva: ['En revisión', 'Aprobada', 'Rechazada'],
        'En revisión': ['Aprobada', 'Rechazada'],
        Aprobada: ['Adoptado', 'Rechazada'],
    };
    return (
        <Shell internal={admin || role === 'superadmin'}>
            <Head title={`Solicitud #${r.id}`} />
            <Title title={`Solicitud #${r.id}`} text={`Presentada el ${date(r.created_at)}`}>
                <div className="flex flex-wrap items-center gap-4">
                    <Badge>{r.status}</Badge>
                    {r.adoption && role !== 'superadmin' && (
                        <Link className="btn" href={`/adopciones/${r.adoption.id}/seguimiento`}>
                            Ver seguimiento
                        </Link>
                    )}
                </div>
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
                    {canChat && (
                        <section className="card flex flex-wrap items-center justify-between gap-4">
                            <div className="min-w-0 flex-1 basis-64">
                                <h2 className="text-lg font-semibold">
                                    Conversación con {admin ? 'la familia' : 'el refugio'}
                                </h2>
                                <p className="mt-1 text-sm text-stone-600">
                                    {chatDeadline
                                        ? `${admin ? 'La familia tiene' : 'Tenés'} tiempo para responder hasta el ${new Date(chatDeadline).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}.`
                                        : 'El chat está en la burbuja de mensajes, abajo a la derecha.'}
                                </p>
                            </div>
                            <button type="button" className="btn" onClick={() => openChat(r.id)}>
                                <Icon name="chat" className="h-4 w-4" />
                                Abrir chat
                            </button>
                        </section>
                    )}
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
