import { Head, useForm } from '@inertiajs/react';
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
    const shelter = shelters.find((s) => s.id === selected);
    return (
        <Shell internal>
            <Head title="Administrar refugios" />
            <Title
                title="Refugios de Huellitas"
                text="Alta manual después de conversar con cada refugio. Administrá su perfil y las cuentas de su equipo."
            />
            <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
                <aside className="card self-start space-y-3">
                    <button
                        className={selected === null ? 'btn w-full' : 'btn-secondary w-full'}
                        onClick={() => setSelected(null)}
                    >
                        + Nuevo refugio
                    </button>
                    {shelters.map((s) => (
                        <button
                            key={s.id}
                            className={selected === s.id ? 'btn w-full' : 'btn-secondary w-full'}
                            onClick={() => setSelected(s.id)}
                        >
                            {s.name} · {s.active ? 'Activo' : 'Inactivo'}
                        </button>
                    ))}
                </aside>
                <div className="space-y-6">
                    <section className="card">
                        <h2 className="mb-6 text-2xl font-semibold">
                            {shelter ? shelter.name : 'Nuevo refugio'}
                        </h2>
                        <ShelterForm
                            key={shelter ? JSON.stringify(shelter) : 'new'}
                            shelter={shelter}
                        />
                    </section>
                    {shelter && (
                        <>
                            <section className="card">
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
