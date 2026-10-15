import { Head, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Animal, MedicalRecord, Page, Shared } from '@/types/shelter';
import { Badge, Errors, Field, Pagination, Shell, Title, date } from '@/Components/Shelter';
import { Dose, HealthAudit } from '@/types/health';
import DoseCard from './DoseCard';
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
    const initial: Record<string, string> = {
        practitioner_name: String(record?.practitioner_name || ''),
        observations: String(record?.observations || ''),
    };
    schemas[type].forEach(([key, , t, options]) => {
        const value = String(record?.[key] || (t === 'select' ? options?.[0] : '') || '');
        initial[key] = t === 'date' ? value.slice(0, 10) : value;
    });
    const f = useForm(initial);
    const sending = useRef(false);
    return (
        <form
            className="card space-y-5"
            onSubmit={(e) => {
                e.preventDefault();
                if (sending.current) return;
                sending.current = true;
                const url = `/veterinaria/${animalId}/${type}`;
                const options = {
                    onSuccess: onDone,
                    onFinish: () => {
                        sending.current = false;
                    },
                    preserveScroll: true,
                };
                if (record) f.patch(url + '/' + record.id, options);
                else f.post(url, options);
            }}
        >
            <h2 className="text-xl font-semibold">
                {record ? 'Editar registro' : 'Agregar registro'} · {labels[type]}
            </h2>
            <Errors errors={f.errors} />
            {[
                ...schemas[type],
                [
                    'practitioner_name',
                    'Profesional que atendió (si se conoce)',
                    'text',
                ] as SchemaField,
                ['observations', 'Observaciones', 'textarea'] as SchemaField,
            ].map(([key, label, t, options]) => (
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
            ))}
            <div className="flex flex-wrap gap-3">
                <button className="btn" disabled={f.processing}>
                    {f.processing ? 'Guardando…' : 'Guardar registro'}
                </button>
                <button
                    type="button"
                    className="btn-secondary"
                    disabled={f.processing}
                    onClick={onDone}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}
export default function History({
    animal,
    readOnly = false,
    doses,
    audits,
}: {
    animal: Animal & Record<Kind, MedicalRecord[]>;
    readOnly?: boolean;
    doses?: Page<Dose>;
    audits?: Page<HealthAudit>;
}) {
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
            {readOnly && (
                <p role="status" className="card mb-6">
                    Animal archivado · Antecedentes de solo lectura. No se admiten cargas,
                    correcciones ni resolución de dosis.
                </p>
            )}
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
                    {user?.role === 'admin' && !readOnly && (
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
                                    ].map(([key, label, kind]) =>
                                        r[key] ? (
                                            <div key={key}>
                                                <dt className="text-xs font-medium text-stone-500">
                                                    {label}
                                                </dt>
                                                <dd className="mt-1 whitespace-pre-wrap break-words text-sm">
                                                    {kind === 'date'
                                                        ? date(String(r[key]))
                                                        : String(r[key])}
                                                </dd>
                                            </div>
                                        ) : null,
                                    )}
                                </dl>
                                <p className="mt-5 text-xs text-stone-500">
                                    Profesional que atendió: {r.practitioner_name || 'Sin informar'}
                                    <br />
                                    Registrado por: {r.recorder?.name} {r.recorder?.last_name}
                                    <br />
                                    Última actualización:{' '}
                                    {r.updater
                                        ? `${r.updater.name} ${r.updater.last_name}`
                                        : 'Sin correcciones registradas'}
                                </p>
                                {user?.role === 'admin' && !readOnly && (
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
                {form && !readOnly && (
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
            {doses && (
                <section className="mt-10 space-y-4">
                    <h2 className="text-2xl font-semibold">
                        Programaciones y cumplimiento de dosis
                    </h2>
                    <p className="text-sm text-stone-600">
                        Las fechas previstas no confirman aplicaciones. Aplicar o cancelar conserva
                        el antecedente.
                    </p>
                    {doses.data.length ? (
                        doses.data.map((d) => (
                            <DoseCard key={JSON.stringify(d)} dose={d} readOnly={readOnly} />
                        ))
                    ) : (
                        <p className="card">No hay dosis programadas.</p>
                    )}
                    <Pagination page={doses} />
                </section>
            )}
            {audits && (
                <section className="mt-10 space-y-4">
                    <h2 className="text-2xl font-semibold">Trazabilidad interna</h2>
                    <p className="text-sm text-stone-600">
                        Registro de consulta, sin acciones de edición o eliminación. Los datos
                        anteriores a esta entrega no tienen auditorías reconstruidas.
                    </p>
                    {audits.data.map((a) => (
                        <article key={a.id} className="card min-w-0 space-y-3">
                            <h3 className="font-semibold">
                                {a.action} · {labels[a.record_type as Kind] || 'Dosis'} #
                                {a.record_id}
                            </h3>
                            <p className="text-sm">
                                {a.actor.name} {a.actor.last_name} ·{' '}
                                {new Date(a.created_at).toLocaleString('es-AR')}
                            </p>
                            <details>
                                <summary className="text-link cursor-pointer">
                                    Consultar valores anteriores y nuevos
                                </summary>
                                <dl className="mt-3 space-y-3">
                                    {Array.from(
                                        new Set([
                                            ...Object.keys(a.before_values),
                                            ...Object.keys(a.after_values),
                                        ]),
                                    ).map((key) => (
                                        <div key={key} className="break-words text-sm">
                                            <dt className="font-semibold">
                                                {[
                                                    ...schemas.consultations,
                                                    ...schemas.vaccinations,
                                                    ...schemas.treatments,
                                                    ...schemas.controls,
                                                ].find(([k]) => k === key)?.[1] ||
                                                    (
                                                        {
                                                            recorded_by: 'ID del autor inicial',
                                                            updated_by: 'ID del último editor',
                                                            practitioner_name: 'Profesional',
                                                            observations: 'Observaciones',
                                                            scheduled_date: 'Fecha programada',
                                                            status: 'Estado',
                                                            resolved_by: 'ID de quien resolvió',
                                                            resolved_at: 'Fecha de resolución',
                                                            application_vaccination_id:
                                                                'ID de la aplicación',
                                                            source_vaccination_id:
                                                                'ID del antecedente',
                                                            cancellation_reason:
                                                                'Motivo de cancelación',
                                                            legacy_unverified:
                                                                'Cumplimiento histórico sin verificar',
                                                        } as Record<string, string>
                                                    )[key] ||
                                                    key}
                                            </dt>
                                            <dd className="whitespace-pre-wrap">
                                                Antes: {String(a.before_values[key] ?? '—')}
                                                <br />
                                                Después: {String(a.after_values[key] ?? '—')}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </details>
                        </article>
                    ))}
                    {!audits.data.length && (
                        <p className="card">No hay modificaciones auditadas en esta etapa.</p>
                    )}
                    <Pagination page={audits} />
                </section>
            )}
        </Shell>
    );
}
