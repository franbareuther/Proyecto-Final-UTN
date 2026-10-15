import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { Application, Page } from '@/types/shelter';
import { Errors, Field, Pagination, RequestList, Shell, Title } from '@/Components/Shelter';
export default function Requests({
    requests,
    filters,
}: {
    requests: Page<Application>;
    filters: Record<string, string>;
}) {
    const f = useForm({ q: filters.q || '', status: filters.status || '' });
    useEffect(
        () => f.setData({ q: filters.q || '', status: filters.status || '' }),
        [filters.q, filters.status],
    );
    return (
        <Shell internal>
            <Head title="Solicitudes" />
            <Title
                title="Solicitudes de adopción"
                text="Aprobar reserva al animal. Registrá Adoptado solo cuando la adopción definitiva se haya concretado."
            />
            <form
                className="card mb-6 grid items-end gap-4 sm:grid-cols-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    f.get('/admin/solicitudes');
                }}
            >
                <Field label="Adoptante o animal" error={f.errors.q}>
                    <input
                        name="q"
                        maxLength={100}
                        value={f.data.q}
                        onChange={(e) => f.setData('q', e.target.value)}
                    />
                </Field>
                <Field label="Estado" error={f.errors.status}>
                    <select
                        value={f.data.status}
                        onChange={(e) => f.setData('status', e.target.value)}
                    >
                        <option value="">Todos</option>
                        {['Nueva', 'En revisión', 'Aprobada', 'Rechazada', 'Adoptado'].map((x) => (
                            <option key={x}>{x}</option>
                        ))}
                    </select>
                </Field>
                <button disabled={f.processing} className="btn">
                    Buscar
                </button>
                <Link className="text-link" href="/admin/solicitudes">
                    Limpiar búsqueda
                </Link>
            </form>
            <Errors errors={f.errors} />
            <RequestList requests={requests.data} admin />
            <Pagination page={requests} />
        </Shell>
    );
}
