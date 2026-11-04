import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Errors, Field, Shell, Title } from '@/Components/Shelter';
import ShelterForm from '@/Components/ShelterForm';
import ShelterImage from '@/Components/ShelterImage';
import Icon from '@/Components/Icon';
import { Refuge } from '@/types/shelter';

// Cantidad de tarjetas visibles antes de desplegar la lista completa.
const PREVIEW = 3;

type Mode = 'list' | 'new' | number;

function StaffForm({ shelter }: { shelter: Refuge }) {
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
                f.post(`/superadmin/refugios/${shelter.slug}/personal`, {
                    preserveScroll: true,
                    onSuccess: () => f.reset(),
                    onFinish: () => f.reset('password', 'password_confirmation'),
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

function ShelterCard({ shelter: s, onEdit }: { shelter: Refuge; onEdit: () => void }) {
    const staff = s.staff?.length ?? 0;
    return (
        <article className="card flex min-w-0 flex-col">
            <ShelterImage src={s.image_url} name={s.name} kind={s.image_type} className="mb-4" />
            <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-words text-lg font-semibold text-emerald-950">
                    {s.name}
                </h3>
                <span
                    className={
                        'inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold ' +
                        (s.active ? 'text-emerald-800' : 'text-stone-500')
                    }
                >
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                    {s.active ? 'Activo' : 'Inactivo'}
                </span>
            </div>
            <p className="mt-1 text-sm text-stone-600">{s.city || 'Localidad sin informar'}</p>
            <p className="mt-1 text-sm text-stone-600">
                {staff === 0
                    ? 'Sin cuentas del equipo'
                    : `${staff} ${staff === 1 ? 'cuenta del equipo' : 'cuentas del equipo'}`}
            </p>
            <div className="mt-auto flex flex-wrap gap-3 pt-5">
                <button type="button" className="btn" onClick={onEdit}>
                    Editar
                </button>
                <Link className="btn-secondary" href={`/refugios/${s.slug}`}>
                    Ver perfil público
                </Link>
            </div>
        </article>
    );
}

export default function Shelters({ shelters }: { shelters: Refuge[] }) {
    // Enlaces directos: ?nuevo=1 abre el alta y ?refugio=slug abre la edición de ese refugio.
    const query = new URLSearchParams(usePage().url.split('?')[1] || '');
    const linked = shelters.find((s) => s.slug === query.get('refugio'));
    const [mode, setMode] = useState<Mode>(
        linked ? linked.id : query.has('nuevo') ? 'new' : 'list',
    );
    const [expanded, setExpanded] = useState(false);
    const [tab, setTab] = useState<'profile' | 'staff'>('profile');
    const shelter = typeof mode === 'number' ? shelters.find((s) => s.id === mode) : undefined;
    const open = (next: Mode) => {
        setMode(next);
        setTab('profile');
        window.scrollTo({ top: 0 });
    };
    const visible = expanded ? shelters : shelters.slice(0, PREVIEW);
    const refugeNavigation = (
        <section className="border-t border-stone-200/70 pt-5" aria-label="Refugios">
            <div className="mb-3 px-3">
                <h2 className="text-sm font-semibold">Refugios</h2>
                <p className="mt-1 text-xs text-stone-500">
                    {shelters.length}{' '}
                    {shelters.length === 1 ? 'refugio registrado' : 'refugios registrados'}
                </p>
            </div>
            <button
                className={
                    'mb-1 flex min-h-10 w-full items-center rounded-lg px-3 text-left text-[13px] ' +
                    (mode === 'new'
                        ? 'bg-emerald-900/8 font-semibold text-emerald-950'
                        : 'text-stone-600 hover:bg-stone-200/50')
                }
                onClick={() => open('new')}
                aria-current={mode === 'new' ? 'page' : undefined}
            >
                + Nuevo refugio
            </button>
            {!shelters.length && (
                <p className="px-3 py-3 text-xs text-stone-500">Todavía no hay refugios.</p>
            )}
            {shelters.map((s) => (
                <button
                    key={s.id}
                    className={
                        'flex min-h-10 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-[13px] ' +
                        (mode === s.id
                            ? 'bg-emerald-900/8 font-semibold text-emerald-950'
                            : 'text-stone-600 hover:bg-stone-200/50')
                    }
                    onClick={() => open(s.id)}
                    aria-current={mode === s.id ? 'page' : undefined}
                >
                    <span className="truncate">{s.name}</span>
                    <span
                        className={
                            'h-1.5 w-1.5 shrink-0 rounded-full ' +
                            (s.active ? 'bg-emerald-600' : 'bg-stone-300')
                        }
                        aria-label={s.active ? 'Activo' : 'Inactivo'}
                    />
                </button>
            ))}
        </section>
    );
    const back = (
        <button type="button" className="text-link mb-4 inline-flex" onClick={() => open('list')}>
            <Icon name="chevron" className="h-4 w-4 rotate-180" /> Volver a los refugios
        </button>
    );
    return (
        <Shell internal sidebar={refugeNavigation}>
            <Head title="Administrar refugios" />
            <Title
                title="Gestionar refugios"
                text="Administrá los datos de cada refugio y las cuentas de su equipo."
            >
                {mode !== 'new' && (
                    <button type="button" className="btn" onClick={() => open('new')}>
                        Nuevo refugio
                    </button>
                )}
            </Title>
            <div className="mb-6 grid grid-cols-2 gap-2.5 sm:mb-8 sm:grid-cols-3 sm:gap-4">
                {[
                    ['Refugios registrados', shelters.length],
                    ['Refugios activos', shelters.filter((item) => item.active).length],
                    [
                        'Cuentas del equipo',
                        shelters.reduce((total, item) => total + (item.staff?.length ?? 0), 0),
                    ],
                ].map(([label, value]) => (
                    <div
                        key={label}
                        className="min-w-0 rounded-lg border border-stone-200 bg-white p-3 sm:rounded-xl sm:p-5"
                    >
                        <p className="text-xs leading-snug text-stone-500 sm:text-sm">{label}</p>
                        <p className="mt-2 text-2xl font-semibold leading-none text-emerald-900 sm:mt-3 sm:text-4xl">
                            {value}
                        </p>
                    </div>
                ))}
            </div>
            {mode === 'list' && (
                <section aria-labelledby="refuges-title">
                    <h2 id="refuges-title" className="mb-4 text-xl font-semibold">
                        Refugios registrados
                    </h2>
                    {shelters.length ? (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {visible.map((s) => (
                                <ShelterCard key={s.id} shelter={s} onEdit={() => open(s.id)} />
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center text-stone-600">
                            Todavía no hay refugios.{' '}
                            <button type="button" className="text-link" onClick={() => open('new')}>
                                Crear el primero
                            </button>
                        </div>
                    )}
                    {shelters.length > PREVIEW && (
                        <div className="mt-6 flex justify-center">
                            <button
                                type="button"
                                className="btn-secondary"
                                aria-expanded={expanded}
                                onClick={() => setExpanded(!expanded)}
                            >
                                {expanded
                                    ? 'Mostrar menos'
                                    : `Ver todos los refugios (${shelters.length})`}
                                <Icon
                                    name="chevron"
                                    className={
                                        'h-4 w-4 transition ' +
                                        (expanded ? '-rotate-90' : 'rotate-90')
                                    }
                                />
                            </button>
                        </div>
                    )}
                </section>
            )}
            {mode === 'new' && (
                <section>
                    {back}
                    <div className="card min-w-0 w-full">
                        <h2 className="mb-6 text-xl font-semibold">Nuevo refugio</h2>
                        <ShelterForm key="new" onSaved={() => open('list')} />
                    </div>
                </section>
            )}
            {shelter && (
                <section>
                    {back}
                    <div className="card min-w-0 w-full">
                        <div className="mb-4 flex gap-4 border-b border-stone-200 text-sm">
                            <button
                                onClick={() => setTab('profile')}
                                className={
                                    'pb-3 ' +
                                    (tab === 'profile'
                                        ? 'border-b-2 border-emerald-900 font-medium'
                                        : 'text-stone-500')
                                }
                            >
                                Datos del refugio
                            </button>
                            <button
                                onClick={() => setTab('staff')}
                                className={
                                    'pb-3 ' +
                                    (tab === 'staff'
                                        ? 'border-b-2 border-emerald-900 font-medium'
                                        : 'text-stone-500')
                                }
                            >
                                Equipo
                            </button>
                        </div>
                        {tab === 'profile' && (
                            <>
                                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                                    <h2 className="text-xl font-semibold">{shelter.name}</h2>
                                    <Link
                                        className="btn-secondary"
                                        href={`/refugios/${shelter.slug}`}
                                    >
                                        Ver perfil público
                                    </Link>
                                </div>
                                <ShelterForm key={JSON.stringify(shelter)} shelter={shelter} />
                            </>
                        )}
                        {tab === 'staff' && (
                            <>
                                <section className="mb-5">
                                    <h2 className="mb-4 text-xl font-semibold">
                                        Equipo del refugio
                                    </h2>
                                    {shelter.staff?.length ? (
                                        <ul className="divide-y">
                                            {shelter.staff.map((u) => (
                                                <li className="break-words py-3" key={u.id}>
                                                    {u.name} {u.last_name} · Administrador del
                                                    refugio
                                                    <br />
                                                    <span className="text-sm text-stone-600">
                                                        {u.email}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>Todavía no tiene personal asignado.</p>
                                    )}
                                </section>
                                <section className="border-t border-stone-200 pt-4">
                                    <h2 className="mb-6 text-xl font-semibold">
                                        Crear cuenta para {shelter.name}
                                    </h2>
                                    <StaffForm key={shelter.id} shelter={shelter} />
                                </section>
                            </>
                        )}
                    </div>
                </section>
            )}
        </Shell>
    );
}
