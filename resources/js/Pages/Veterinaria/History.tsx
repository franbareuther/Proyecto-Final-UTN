import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Animal, MedicalRecord, Shared } from '@/types/shelter';
import { Badge, Errors, Field, Shell, Title } from '@/Components/Shelter';
type Kind = 'consultations' | 'vaccinations' | 'treatments' | 'controls';
type SchemaField = [string, string, string, string[]?];
const schemas: Record<Kind, SchemaField[]> = {
    consultations: [
        ['consultation_date', 'Fecha de consulta', 'date'],
        ['reason', 'Motivo', 'text'],
        ['symptoms', 'Síntomas', 'textarea'],
        ['diagnosis', 'Diagnóstico registrado por el profesional', 'textarea'],
        ['instructions', 'Indicaciones', 'textarea'],
    ],
    vaccinations: [
        ['vaccine_name', 'Vacuna', 'text'],
        ['application_date', 'Fecha de aplicación', 'date'],
        ['dose', 'Dosis', 'text'],
        ['next_dose_date', 'Próxima dosis', 'date'],
    ],
    treatments: [
        ['description', 'Descripción', 'textarea'],
        ['start_date', 'Inicio', 'date'],
        ['estimated_end_date', 'Finalización estimada', 'date'],
        ['status', 'Estado', 'select', ['Activo', 'Finalizado', 'Suspendido']],
    ],
    controls: [
        ['control_type', 'Tipo de control', 'text'],
        ['scheduled_date', 'Fecha programada', 'date'],
        ['status', 'Estado', 'select', ['Pendiente', 'Realizado', 'Cancelado']],
    ],
};
const labels: Record<Kind, string> = {
    consultations: 'Consultas',
    vaccinations: 'Vacunas',
    treatments: 'Tratamientos',
    controls: 'Controles',
};
function MedicalForm({
    animalId,
    type,
    record,
    onDone,
}: {
    animalId: number;
    type: Kind;
    record?: MedicalRecord;
    onDone: () => void;
}) {
    const initial: Record<string, string> = { observations: String(record?.observations || '') };
    schemas[type].forEach(
        ([key, , t, options]) =>
            (initial[key] = String(record?.[key] || (t === 'select' ? options?.[0] : '') || '')),
    );
    const f = useForm(initial);
    return (
        <form
            className="card space-y-5"
            onSubmit={(e) => {
                e.preventDefault();
                const url = `/veterinaria/${animalId}/${type}`;
                if (record) f.patch(url + '/' + record.id, { onSuccess: onDone });
                else f.post(url, { onSuccess: onDone });
            }}
        >
            <h2 className="text-xl font-semibold">
                {record ? 'Editar registro' : 'Agregar registro'} · {labels[type]}
            </h2>
            <Errors errors={f.errors} />
            {[...schemas[type], ['observations', 'Observaciones', 'textarea'] as SchemaField].map(
                ([key, label, t, options]) => (
                    <Field key={key} label={label} error={f.errors[key]}>
                        {t === 'select' ? (
                            <select
                                value={f.data[key]}
                                onChange={(e) => f.setData(key, e.target.value)}
                            >
                                {options?.map((x) => (
                                    <option key={x}>{x}</option>
                                ))}
                            </select>
                        ) : t === 'textarea' ? (
                            <textarea
                                rows={3}
                                value={f.data[key]}
                                onChange={(e) => f.setData(key, e.target.value)}
                            />
                        ) : (
                            <input
                                type={t}
                                value={f.data[key]}
                                onChange={(e) => f.setData(key, e.target.value)}
                            />
                        )}
                    </Field>
                ),
            )}
            <div className="flex gap-3">
                <button className="btn" disabled={f.processing}>
                    {f.processing ? 'Guardando…' : 'Guardar registro'}
                </button>
                <button type="button" className="btn-secondary" onClick={onDone}>
                    Cancelar
                </button>
            </div>
        </form>
    );
}
export default function History({ animal }: { animal: Animal & Record<Kind, MedicalRecord[]> }) {
    const user = usePage<Shared>().props.auth.user;
    const [type, setType] = useState<Kind>('consultations');
    const [form, setForm] = useState(false);
    const [editing, setEditing] = useState<MedicalRecord>();
    return (
        <Shell internal>
            <Head title={'Historia clínica de ' + animal.name} />
            <Title
                title={'Historia clínica · ' + animal.name}
                text={`${animal.species} · ${animal.breed || 'Sin raza especificada'} · ${animal.sex}`}
            >
                <Badge>Información interna del refugio</Badge>
            </Title>
            <div className="mb-6 flex flex-wrap gap-3">
                {(Object.keys(labels) as Kind[]).map((k) => (
                    <button
                        key={k}
                        className={type === k ? 'btn' : 'btn-secondary'}
                        onClick={() => {
                            setType(k);
                            setForm(false);
                            setEditing(undefined);
                        }}
                    >
                        {labels[k]} ({animal[k].length})
                    </button>
                ))}
            </div>
            <div className="grid items-start gap-6 xl:grid-cols-2">
                <section className="space-y-4">
                    {user?.role === 'veterinario' && (
                        <button
                            className="btn"
                            onClick={() => {
                                setForm(true);
                                setEditing(undefined);
                            }}
                        >
                            + Agregar {labels[type].toLowerCase()}
                        </button>
                    )}
                    {animal[type].length ? (
                        animal[type].map((r) => (
                            <article key={r.id} className="card">
                                <dl className="space-y-3">
                                    {[
                                        ...schemas[type],
                                        [
                                            'observations',
                                            'Observaciones',
                                            'textarea',
                                        ] as SchemaField,
                                    ].map(([key, label]) =>
                                        r[key] ? (
                                            <div key={key}>
                                                <dt className="text-xs font-medium text-stone-500">
                                                    {label}
                                                </dt>
                                                <dd className="mt-1 whitespace-pre-wrap break-words text-sm">
                                                    {String(r[key])}
                                                </dd>
                                            </div>
                                        ) : null,
                                    )}
                                </dl>
                                <p className="mt-5 text-xs text-stone-500">
                                    Profesional: {r.veterinarian?.name} {r.veterinarian?.last_name}
                                </p>
                                {user?.role === 'veterinario' && r.veterinarian_id === user.id && (
                                    <button
                                        className="btn-secondary mt-4"
                                        onClick={() => {
                                            setEditing(r);
                                            setForm(true);
                                        }}
                                    >
                                        Editar / actualizar estado
                                    </button>
                                )}
                            </article>
                        ))
                    ) : (
                        <div className="card text-stone-500">
                            No hay registros de {labels[type].toLowerCase()}.
                        </div>
                    )}
                </section>
                {form && (
                    <MedicalForm
                        key={type + '-' + (editing?.id || 'new')}
                        animalId={animal.id}
                        type={type}
                        record={editing}
                        onDone={() => {
                            setForm(false);
                            setEditing(undefined);
                        }}
                    />
                )}
            </div>
        </Shell>
    );
}
