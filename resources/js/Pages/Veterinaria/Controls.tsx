import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { MedicalRecord, Page } from '@/types/shelter';
import { Dose } from '@/types/health';
import { Badge, date, Empty, Errors, Field, Pagination, Shell, Title } from '@/Components/Shelter';

export default function Controls({
    controls,
    doses,
    today,
    filters = {},
}: {
    controls: Page<MedicalRecord>;
    doses?: Page<Dose>;
    today: string;
    filters?: Record<string, string>;
}) {
    const f = useForm({ bucket: filters.bucket || 'pending' });
    useEffect(() => f.setData('bucket', filters.bucket || 'pending'), [filters.bucket]);
    const label = (status: string, scheduled: string) =>
        status !== 'Pendiente'
            ? status
            : scheduled.slice(0, 10) < today
              ? 'Vencido'
              : scheduled.slice(0, 10) === today
                ? 'Hoy'
                : 'Próximo';
    return (
        <Shell internal>
            <Head title="Agenda de cuidados" />
            <Title
                title="Agenda de cuidados"
                text="Controles y dosis con cumplimiento explícito. Los antecedentes archivados se consultan sin modificar."
            />
            <form
                className="card mb-6 flex flex-wrap items-end gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    f.get('/veterinaria/controles');
                }}
            >
                <Field label="Período o cumplimiento" error={f.errors.bucket}>
                    <select
                        name="bucket"
                        value={f.data.bucket}
                        onChange={(e) => f.setData('bucket', e.target.value)}
                    >
                        {[
                            ['pending', 'Pendientes hasta 30 días (incluye vencidos)'],
                            ['overdue', 'Vencidos'],
                            ['today', 'Hoy'],
                            ['upcoming', 'Próximos 30 días'],
                            ['completed', 'Realizados / Aplicadas'],
                            ['cancelled', 'Cancelados'],
                            ['all', 'Todos (incluye posteriores a 30 días)'],
                        ].map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </Field>
                <button className="btn" disabled={f.processing}>
                    Consultar agenda
                </button>
                <Link className="text-link" href="/veterinaria/controles">
                    Limpiar filtro
                </Link>
            </form>
            <Errors errors={f.errors} />
            <h2 className="mb-4 text-xl font-semibold">Controles</h2>
            {controls.data.length ? (
                <div className="card divide-y p-0">
                    {controls.data.map((c) => (
                        <Link
                            key={c.id}
                            className="flex flex-wrap items-center justify-between gap-4 p-5"
                            href={'/veterinaria/' + c.animal?.id}
                        >
                            <div className="min-w-0 break-words">
                                <strong>{c.animal?.name}</strong>
                                <p className="mt-1 text-sm text-stone-600">
                                    {String(c.control_type)} · {date(String(c.scheduled_date))}
                                </p>
                                {c.animal?.deleted_at && (
                                    <p className="text-sm">Archivado · Solo lectura</p>
                                )}
                            </div>
                            <Badge>{label(String(c.status), String(c.scheduled_date))}</Badge>
                        </Link>
                    ))}
                </div>
            ) : (
                <Empty>No hay controles con este filtro.</Empty>
            )}
            <Pagination page={controls} />
            <h2 className="mb-4 mt-10 text-xl font-semibold">Dosis programadas</h2>
            {doses?.data.length ? (
                <div className="card divide-y p-0">
                    {doses.data.map((d) => (
                        <Link
                            key={d.id}
                            className="block space-y-2 break-words p-5"
                            href={'/veterinaria/' + d.animal_id}
                        >
                            <strong>
                                {d.animal?.name} · {String(d.source.vaccine_name)}
                            </strong>
                            <p className="text-sm text-stone-600">
                                Fecha prevista: {date(d.scheduled_date)}
                            </p>
                            <Badge>{label(d.status, d.scheduled_date)}</Badge>
                            {d.legacy_unverified && (
                                <p className="text-sm">Cumplimiento histórico sin verificar.</p>
                            )}
                            {d.animal?.deleted_at && (
                                <p className="text-sm">Archivado · Solo lectura</p>
                            )}
                            <p className="text-sm text-emerald-800">
                                Consultar historia y cumplimiento →
                            </p>
                        </Link>
                    ))}
                </div>
            ) : (
                <Empty>No hay dosis con este filtro.</Empty>
            )}
            {doses && <Pagination page={doses} />}
        </Shell>
    );
}
