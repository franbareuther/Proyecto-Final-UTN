import { Head, Link, useForm } from '@inertiajs/react';
import { Badge, date, Empty, Errors, Field, Pagination, Shell, Title } from '@/Components/Shelter';
import { Page } from '@/types/shelter';

type View = 'animales' | 'solicitudes' | 'adopciones' | 'controles' | 'dosis';
type Row = {
    id: number;
    animal: string;
    photo_url: string;
    shelter: string;
    archived: boolean;
    status: string;
    detail: string;
    date: string | null;
    href: string;
};
const headings: Record<View, { title: string; detail: string; date: string }> = {
    animales: { title: 'Todos los animales', detail: 'Especie y características', date: 'Ingreso' },
    solicitudes: { title: 'Solicitudes de la red', detail: 'Adoptante', date: 'Presentada' },
    adopciones: { title: 'Adopciones de la red', detail: 'Adoptante', date: 'Adopción' },
    controles: { title: 'Controles de la red', detail: 'Tipo de control', date: 'Programado' },
    dosis: { title: 'Vacunas y dosis de la red', detail: 'Vacuna', date: 'Programada' },
};

export default function Network({
    view,
    records,
    filters,
    statuses,
    shelters,
}: {
    view: View;
    records: Page<Row>;
    filters: Record<string, string>;
    statuses: string[];
    shelters: { id: number; name: string }[];
}) {
    const form = useForm({
        q: filters.q || '',
        shelter: String(filters.shelter || ''),
        status: filters.status || '',
        archive: filters.archive || 'all',
        period: filters.period || 'all',
        treatment: filters.treatment || '',
    });
    const heading = headings[view];
    const path = `/superadmin/${view}`;
    return (
        <Shell internal>
            <Head title={heading.title} />
            <Title
                title={heading.title}
                text={`${records.total} registros de toda la red. Podés consultar los detalles y filtrar por refugio.`}
            >
                <Link className="btn-secondary" href="/superadmin">
                    Volver al resumen
                </Link>
            </Title>
            <form
                key={view}
                className="card mb-6 grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.get(path);
                }}
            >
                <Field
                    label={
                        view === 'solicitudes' || view === 'adopciones'
                            ? 'Animal o adoptante'
                            : 'Nombre del animal'
                    }
                >
                    <input
                        maxLength={100}
                        value={form.data.q}
                        onChange={(event) => form.setData('q', event.target.value)}
                    />
                </Field>
                <Field label="Refugio">
                    <select
                        value={form.data.shelter}
                        onChange={(event) => form.setData('shelter', event.target.value)}
                    >
                        <option value="">Todos los refugios</option>
                        {shelters.map((shelter) => (
                            <option key={shelter.id} value={shelter.id}>
                                {shelter.name}
                            </option>
                        ))}
                    </select>
                </Field>
                {statuses.length > 0 && (
                    <Field label="Estado">
                        <select
                            value={form.data.status}
                            onChange={(event) => form.setData('status', event.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            {statuses.map((status) => (
                                <option key={status}>{status}</option>
                            ))}
                        </select>
                    </Field>
                )}
                {view === 'animales' && (
                    <>
                        <Field label="Archivo">
                            <select
                                value={form.data.archive}
                                onChange={(event) => form.setData('archive', event.target.value)}
                            >
                                <option value="all">Todos, incluidos archivados</option>
                                <option value="active">Sin archivar</option>
                                <option value="archived">Archivados</option>
                            </select>
                        </Field>
                        <Field label="Tratamientos">
                            <select
                                value={form.data.treatment}
                                onChange={(event) => form.setData('treatment', event.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="active">Con tratamiento activo</option>
                            </select>
                        </Field>
                    </>
                )}
                {['solicitudes', 'controles', 'dosis'].includes(view) && (
                    <Field label={view === 'solicitudes' ? 'Revisión' : 'Agenda'}>
                        <select
                            value={form.data.period}
                            onChange={(event) => form.setData('period', event.target.value)}
                        >
                            <option value="all">Todos los registros</option>
                            <option value="pending">
                                {view === 'solicitudes' ? 'Por revisar' : 'Todos los pendientes'}
                            </option>
                            {view !== 'solicitudes' && (
                                <>
                                    <option value="overdue">Vencidos pendientes</option>
                                    <option value="today">Pendientes para hoy</option>
                                    <option value="upcoming">Próximos 30 días</option>
                                </>
                            )}
                        </select>
                    </Field>
                )}
                <div className="flex flex-wrap gap-3">
                    <button className="btn" disabled={form.processing}>
                        Filtrar
                    </button>
                    <Link className="btn-secondary" href={path}>
                        Limpiar
                    </Link>
                </div>
            </form>
            <Errors errors={form.errors} />
            {records.data.length ? (
                <div className="card overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-200 text-stone-500">
                            <tr>
                                {[
                                    'Animal',
                                    'Refugio',
                                    heading.detail,
                                    'Estado',
                                    heading.date,
                                    'Detalle',
                                ].map((label) => (
                                    <th className="whitespace-nowrap p-3 font-medium" key={label}>
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {records.data.map((row) => (
                                <tr key={row.id}>
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={row.photo_url}
                                                alt=""
                                                className="h-12 w-12 shrink-0 rounded-xl object-cover"
                                            />
                                            <div>
                                                <strong>{row.animal}</strong>
                                                {row.archived && (
                                                    <p className="mt-1 text-xs text-stone-500">
                                                        Archivado
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3">{row.shelter || 'Sin refugio'}</td>
                                    <td className="p-3">{row.detail}</td>
                                    <td className="p-3">
                                        <Badge>{row.status}</Badge>
                                    </td>
                                    <td className="whitespace-nowrap p-3">
                                        {row.date ? date(row.date) : 'Sin fecha'}
                                    </td>
                                    <td className="p-3">
                                        <Link
                                            className="text-link whitespace-nowrap"
                                            href={row.href}
                                        >
                                            {view === 'solicitudes'
                                                ? 'Ver solicitud'
                                                : 'Historia clínica'}{' '}
                                            →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Empty>No hay registros para estos filtros.</Empty>
            )}
            <Pagination page={records} />
        </Shell>
    );
}
