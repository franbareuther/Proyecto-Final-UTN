import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { Empty, Errors, Field, Pagination, Shell, Title } from '@/Components/Shelter';
import ShelterForm from '@/Components/ShelterForm';
import { Page, Person, Refuge } from '@/types/shelter';
import StaffEditor from './StaffEditor';

function StaffForm({ shelter }: { shelter: Refuge }) {
    const submitting = useRef(false);
    const f = useForm({
        name: '',
        last_name: '',
        email: '',
        role: 'admin',
        password: '',
        password_confirmation: '',
    });
    return (
        <form
            className="space-y-4"
            onSubmit={(e) => {
                e.preventDefault();
                if (submitting.current) return;
                submitting.current = true;
                f.post(`/superadmin/refugios/${shelter.slug}/personal`, {
                    preserveScroll: true,
                    onSuccess: () => f.reset(),
                    onFinish: () => {
                        submitting.current = false;
                        f.reset('password', 'password_confirmation');
                    },
                });
            }}
        >
            <Errors errors={f.errors} />
            <div className="grid gap-4 sm:grid-cols-2">
                {(
                    [
                        ['name', 'Nombre', 'text'],
                        ['last_name', 'Apellido', 'text'],
                        ['email', 'Correo de acceso', 'email'],
                        ['password', 'Contraseña inicial (mínimo 12 caracteres)', 'password'],
                        ['password_confirmation', 'Repetir contraseña', 'password'],
                    ] as const
                ).map(([key, label, type]) => (
                    <Field key={key} label={label} error={f.errors[key]}>
                        <input
                            required
                            className="input"
                            type={type}
                            autoComplete={type === 'password' ? 'new-password' : undefined}
                            value={f.data[key]}
                            onChange={(e) => f.setData(key, e.target.value)}
                        />
                    </Field>
                ))}
            </div>
            <p className="text-sm text-emerald-800">
                Esta cuenta administrará los animales, adopciones y salud de este refugio.
            </p>
            <p className="text-sm text-stone-600">
                Coordiná la entrega de acceso con la persona responsable. Podrá cambiar la
                contraseña desde su perfil.
            </p>
            <button className="btn" disabled={f.processing}>
                Crear cuenta
            </button>
        </form>
    );
}

export default function Shelters({
    shelters,
    pagination,
    selectedShelter,
    staffPagination,
    filters = {},
}: {
    shelters: Refuge[];
    pagination?: Page<Refuge>;
    selectedShelter?: Refuge | null;
    staffPagination?: Page<Person> | null;
    filters?: Record<string, string>;
}) {
    const shelter = selectedShelter || undefined;
    const f = useForm({ q: filters.q || '', state: filters.state || '' });
    const staffSearch = useForm({
        staff_q: filters.staff_q || '',
        staff_state: filters.staff_state || '',
    });
    useEffect(
        () => f.setData({ q: filters.q || '', state: filters.state || '' }),
        [filters.q, filters.state],
    );
    useEffect(
        () =>
            staffSearch.setData({
                staff_q: filters.staff_q || '',
                staff_state: filters.staff_state || '',
            }),
        [filters.staff_q, filters.staff_state, shelter?.id],
    );
    const url = usePage().url;
    const selectUrl = (id?: number) => {
        const query = new URLSearchParams(url.split('?')[1] || '');
        for (const key of ['selected', 'staff_q', 'staff_state', 'staff_page']) query.delete(key);
        if (id) query.set('selected', String(id));
        return '/superadmin/refugios' + (query.size ? '?' + query.toString() : '');
    };
    return (
        <Shell internal>
            <Head title="Administrar refugios" />
            <Title
                title="Refugios de Huella"
                text="Alta manual después de conversar con cada refugio. Administrá su perfil y las cuentas de su equipo."
            />
            <form
                className="card mb-6 flex flex-wrap items-end gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    f.get('/superadmin/refugios');
                }}
            >
                <Field label="Nombre, identificador o ciudad" error={f.errors.q}>
                    <input
                        type="search"
                        name="q"
                        maxLength={100}
                        value={f.data.q}
                        onChange={(e) => f.setData('q', e.target.value)}
                    />
                </Field>
                <Field label="Habilitación" error={f.errors.state}>
                    <select
                        name="state"
                        value={f.data.state}
                        onChange={(e) => f.setData('state', e.target.value)}
                    >
                        <option value="">Todos los refugios</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                </Field>
                <button className="btn" disabled={f.processing}>
                    Buscar refugios
                </button>
                <Link className="text-link" href="/superadmin/refugios">
                    Limpiar búsqueda
                </Link>
            </form>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <aside className="card min-w-0 self-start space-y-3">
                    <Link
                        className={!shelter ? 'btn w-full' : 'btn-secondary w-full'}
                        href={selectUrl()}
                    >
                        + Nuevo refugio
                    </Link>
                    {shelters.map((s) => (
                        <Link
                            key={s.id}
                            className={
                                shelter?.id === s.id
                                    ? 'btn w-full break-words'
                                    : 'btn-secondary w-full break-words'
                            }
                            href={selectUrl(s.id)}
                            aria-current={shelter?.id === s.id ? 'page' : undefined}
                        >
                            {s.name} · {s.active ? 'Activo' : 'Inactivo'}
                        </Link>
                    ))}
                    {!shelters.length && (
                        <p className="text-sm text-stone-600">
                            No encontramos refugios con esta búsqueda.
                        </p>
                    )}
                    {pagination && <Pagination page={pagination} />}
                </aside>
                <div className="min-w-0 space-y-6">
                    <section className="card">
                        <h2 className="mb-6 break-words text-2xl font-semibold">
                            {shelter ? shelter.name : 'Nuevo refugio'}
                        </h2>
                        <ShelterForm
                            key={shelter ? JSON.stringify({ ...shelter, staff: undefined }) : 'new'}
                            shelter={shelter}
                        />
                    </section>
                    {shelter && (
                        <>
                            <section className="card">
                                <h2 className="mb-4 text-xl font-semibold">Equipo del refugio</h2>
                                <form
                                    className="mb-5 flex flex-wrap items-end gap-4"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        staffSearch.transform((data) => ({
                                            ...data,
                                            selected: shelter.id,
                                            q: filters.q || '',
                                            state: filters.state || '',
                                        }));
                                        staffSearch.get('/superadmin/refugios', {
                                            preserveScroll: true,
                                        });
                                    }}
                                >
                                    <Field
                                        label="Nombre o correo del personal"
                                        error={staffSearch.errors.staff_q}
                                    >
                                        <input
                                            type="search"
                                            maxLength={100}
                                            value={staffSearch.data.staff_q}
                                            onChange={(e) =>
                                                staffSearch.setData('staff_q', e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Acceso del personal"
                                        error={staffSearch.errors.staff_state}
                                    >
                                        <select
                                            value={staffSearch.data.staff_state}
                                            onChange={(e) =>
                                                staffSearch.setData('staff_state', e.target.value)
                                            }
                                        >
                                            <option value="">Todas las cuentas</option>
                                            <option value="active">Habilitadas</option>
                                            <option value="suspended">Suspendidas</option>
                                        </select>
                                    </Field>
                                    <button
                                        className="btn-secondary"
                                        disabled={staffSearch.processing}
                                    >
                                        Buscar cuentas
                                    </button>
                                    <Link className="text-link" href={selectUrl(shelter.id)}>
                                        Limpiar personal
                                    </Link>
                                </form>
                                {shelter.staff?.length ? (
                                    <div className="space-y-5">
                                        {shelter.staff.map((u) => (
                                            <StaffEditor
                                                key={JSON.stringify(u)}
                                                person={u}
                                                shelter={shelter}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <Empty>
                                        No hay cuentas con estos criterios en este refugio.
                                    </Empty>
                                )}
                                {staffPagination && <Pagination page={staffPagination} />}
                            </section>
                            <section className="card">
                                <h2 className="mb-6 text-xl font-semibold">
                                    Crear cuenta para {shelter.name}
                                </h2>
                                <StaffForm key={shelter.id} shelter={shelter} />
                            </section>
                        </>
                    )}
                </div>
            </div>
        </Shell>
    );
}
