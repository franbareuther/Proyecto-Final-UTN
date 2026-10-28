import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Errors, Field, Shell, Title } from '@/Components/Shelter';
import ShelterForm from '@/Components/ShelterForm';
import { Refuge } from '@/types/shelter';

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

export default function Shelters({ shelters }: { shelters: Refuge[] }) {
    const [selected, setSelected] = useState<number | null>(null);
    const [tab, setTab] = useState<'profile' | 'staff'>('profile');
    const shelter = shelters.find((s) => s.id === selected);
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
                    (selected === null
                        ? 'bg-emerald-900/8 font-semibold text-emerald-950'
                        : 'text-stone-600 hover:bg-stone-200/50')
                }
                onClick={() => {
                    setSelected(null);
                    setTab('profile');
                }}
                aria-current={selected === null ? 'page' : undefined}
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
                        (selected === s.id
                            ? 'bg-emerald-900/8 font-semibold text-emerald-950'
                            : 'text-stone-600 hover:bg-stone-200/50')
                    }
                    onClick={() => {
                        setSelected(s.id);
                        setTab('profile');
                    }}
                    aria-current={selected === s.id ? 'page' : undefined}
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
    return (
        <Shell internal sidebar={refugeNavigation}>
            <Head title="Administrar refugios" />
            <Title
                title="Gestionar refugios"
                text="Administrá los datos de cada refugio y las cuentas de su equipo."
            >
                <button
                    type="button"
                    className="btn"
                    onClick={() => {
                        setSelected(null);
                        setTab('profile');
                    }}
                >
                    Nuevo refugio
                </button>
            </Title>
            <div className="mb-6 grid grid-cols-2 gap-2.5 sm:mb-8 sm:grid-cols-3 sm:gap-4">
                {[
                    ['Refugios registrados', shelters.length],
                    ['Refugios activos', shelters.filter((item) => item.active).length],
                    ['Cuentas del equipo', shelters.reduce((total, item) => total + (item.staff?.length ?? 0), 0)],
                ].map(([label, value]) => (
                    <div key={label} className="min-w-0 rounded-lg border border-stone-200 bg-white p-3 sm:rounded-xl sm:p-5">
                        <p className="text-xs leading-snug text-stone-500 sm:text-sm">{label}</p>
                        <p className="mt-2 text-2xl font-semibold leading-none text-emerald-900 sm:mt-3 sm:text-4xl">{value}</p>
                    </div>
                ))}
            </div>
            <div className="card min-w-0 w-full">
                {shelter && (
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
                )}
                {tab === 'profile' && (
                    <section>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-semibold">
                                {shelter ? shelter.name : 'Nuevo refugio'}
                            </h2>
                            {shelter && (
                                <Link className="btn-secondary" href={`/refugios/${shelter.slug}`}>
                                    Ver perfil público
                                </Link>
                            )}
                        </div>
                        <ShelterForm
                            key={shelter ? JSON.stringify(shelter) : 'new'}
                            shelter={shelter}
                        />
                    </section>
                )}
                {shelter && tab === 'staff' && (
                    <>
                        <section className="mb-5">
                            <h2 className="mb-4 text-xl font-semibold">Equipo del refugio</h2>
                            {shelter.staff?.length ? (
                                <ul className="divide-y">
                                    {shelter.staff.map((u) => (
                                        <li className="break-words py-3" key={u.id}>
                                            {u.name} {u.last_name} · Administrador del refugio
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
        </Shell>
    );
}
