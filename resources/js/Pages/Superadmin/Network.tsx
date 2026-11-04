import { Head, Link, useForm } from '@inertiajs/react';
import { Badge, date, Empty, Errors, Field, Pagination, Shell, Title } from '@/Components/Shelter';
import { Page } from '@/types/shelter';
import ShelterImage from '@/Components/ShelterImage';

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

type RefugeSummary = {
    id: number;
    name: string;
    city: string | null;
    active: boolean;
    image_url: string | null;
    image_type: 'photo' | 'logo';
    total: number;
    pending: number;
    approved: number;
    adopted: number;
};

function RefugePicker({
    refuges,
    filters,
}: {
    refuges: RefugeSummary[];
    filters: Record<string, string>;
}) {
    const search = useForm({ q: '' });
    // Conserva los filtros que llegan desde el resumen, por ejemplo "por revisar".
    const keep = new URLSearchParams(
        Object.entries(filters).filter(
            ([key, value]) => value && ['status', 'period'].includes(key),
        ),
    );
    const total = refuges.reduce((sum, r) => sum + r.total, 0);
    return (
        <>
            <Title
                title="Solicitudes de la red"
                text={`${total} solicitudes en toda la red. Elegí un refugio para ver las suyas.`}
            >
                <Link className="btn-secondary" href="/superadmin">
                    Volver al resumen
                </Link>
            </Title>
            <form
                className="card mb-6 flex flex-wrap items-end gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    search.get('/superadmin/solicitudes');
                }}
            >
                <div className="min-w-0 flex-1 basis-64">
                    <Field label="Buscar animal o adoptante en toda la red">
                        <input
                            maxLength={100}
                            value={search.data.q}
                            onChange={(event) => search.setData('q', event.target.value)}
                        />
                    </Field>
                </div>
                <button className="btn" disabled={search.processing || !search.data.q.trim()}>
                    Buscar
                </button>
            </form>
            {refuges.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {refuges.map((r) => {
                        const query = new URLSearchParams(keep);
                        query.set('shelter', String(r.id));
                        return (
                            <Link
                                key={r.id}
                                href={`/superadmin/solicitudes?${query.toString()}`}
                                className="card flex min-w-0 flex-col transition hover:border-emerald-800"
                            >
                                <ShelterImage
                                    src={r.image_url}
                                    name={r.name}
                                    kind={r.image_type}
                                    className="mb-4"
                                />
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="min-w-0 break-words text-lg font-semibold text-emerald-950">
                                        {r.name}
                                    </h2>
                                    <span
                                        className={
                                            'inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold ' +
                                            (r.active ? 'text-emerald-800' : 'text-stone-500')
                                        }
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="h-1.5 w-1.5 rounded-full bg-current"
                                        />
                                        {r.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-stone-600">
                                    {r.city || 'Localidad sin informar'}
                                </p>
                                <dl className="mt-4 grid grid-cols-4 gap-2 border-t border-stone-100 pt-4 text-center">
                                    {(
                                        [
                                            ['Total', r.total, 'text-emerald-950'],
                                            ['Por revisar', r.pending, 'text-amber-700'],
                                            ['Aprobadas', r.approved, 'text-emerald-800'],
                                            ['Adoptadas', r.adopted, 'text-sky-700'],
                                        ] as const
                                    ).map(([label, value, color]) => (
                                        <div key={label} className="min-w-0">
                                            <dd className={'text-xl font-semibold ' + color}>
                                                {value}
                                            </dd>
                                            <dt className="mt-0.5 text-[11px] leading-tight text-stone-500">
                                                {label}
                                            </dt>
                                        </div>
                                    ))}
                                </dl>
                                <span className="mt-4 text-sm font-semibold text-emerald-800">
                                    {r.total ? 'Ver solicitudes →' : 'Sin solicitudes todavía'}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <Empty>Todavía no hay refugios en la red.</Empty>
            )}
        </>
    );
}

export default function Network({
    view,
    records,
    filters,
    statuses,
    shelters,
    refuges = [],
}: {
    view: View;
    records: Page<Row>;
    filters: Record<string, string>;
    statuses: string[];
    shelters: { id: number; name: string }[];
    refuges?: RefugeSummary[];
}) {
    // En Solicitudes se elige primero el refugio; una búsqueda recorre toda la red.
    const picker = view === 'solicitudes' && !filters.shelter && !filters.q;
    const chosen =
        view === 'solicitudes'
            ? shelters.find((s) => String(s.id) === String(filters.shelter))
            : undefined;
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
    if (picker) {
        return (
            <Shell internal>
                <Head title={heading.title} />
                <RefugePicker refuges={refuges} filters={filters} />
            </Shell>
        );
    }
    return (
        <Shell internal>
            <Head title={chosen ? `Solicitudes · ${chosen.name}` : heading.title} />
            <Title
                title={chosen ? `Solicitudes · ${chosen.name}` : heading.title}
                text={
                    chosen
                        ? `${records.total} solicitudes de este refugio. Podés filtrarlas por estado o buscar por animal o adoptante.`
                        : `${records.total} registros de toda la red. Podés consultar los detalles y filtrar por refugio.`
                }
            >
                <Link
                    className="btn-secondary"
                    href={view === 'solicitudes' ? '/superadmin/solicitudes' : '/superadmin'}
                >
                    {view === 'solicitudes' ? '← Todos los refugios' : 'Volver al resumen'}
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
                {/* En Solicitudes el refugio ya se eligió desde las tarjetas. */}
                {view !== 'solicitudes' && (
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
                )}
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
                    <Link
                        className="btn-secondary"
                        href={chosen ? `${path}?shelter=${chosen.id}` : path}
                    >
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
