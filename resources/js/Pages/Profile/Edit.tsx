import { Head, useForm, usePage } from '@inertiajs/react';
import { Shared } from '@/types/shelter';
import { Errors, Field, Shell, Title } from '@/Components/Shelter';
export default function Edit() {
    const u = usePage<Shared>().props.auth.user!;
    const f = useForm({ name: u.name, last_name: u.last_name, email: u.email || '' });
    const p = useForm({ current_password: '', password: '', password_confirmation: '' });
    return (
        <Shell internal={u.role !== 'adoptante'}>
            <Head title="Mi perfil" />
            <Title
                title="Mi perfil"
                text="Mantené tus datos actualizados para que podamos acompañarte."
            />
            <div className="grid items-start gap-6 lg:grid-cols-2">
                <form
                    className="card space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.patch('/profile');
                    }}
                >
                    <h2 className="text-xl font-semibold">Datos personales</h2>
                    <Errors errors={f.errors} />
                    {(
                        [
                            ['name', 'Nombre'],
                            ['last_name', 'Apellido'],
                            ['email', 'Correo electrónico'],
                        ] as const
                    ).map(([k, l]) => (
                        <Field key={k} label={l}>
                            <input
                                type={k === 'email' ? 'email' : 'text'}
                                required
                                value={f.data[k]}
                                onChange={(e) => f.setData(k, e.target.value)}
                            />
                        </Field>
                    ))}
                    {f.recentlySuccessful && (
                        <p role="status" className="text-emerald-800">
                            Datos guardados.
                        </p>
                    )}
                    <button className="btn" disabled={f.processing}>
                        Guardar datos
                    </button>
                </form>
                <form
                    className="card space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        p.put('/password', { onSuccess: () => p.reset() });
                    }}
                >
                    <h2 className="text-xl font-semibold">Cambiar contraseña</h2>
                    <Errors errors={p.errors} />
                    {(
                        [
                            ['current_password', 'Contraseña actual'],
                            ['password', 'Nueva contraseña'],
                            ['password_confirmation', 'Confirmar nueva contraseña'],
                        ] as const
                    ).map(([k, l]) => (
                        <Field key={k} label={l}>
                            <input
                                type="password"
                                autoComplete={
                                    k === 'current_password' ? 'current-password' : 'new-password'
                                }
                                required
                                value={p.data[k]}
                                onChange={(e) => p.setData(k, e.target.value)}
                            />
                        </Field>
                    ))}
                    {p.recentlySuccessful && (
                        <p role="status" className="text-emerald-800">
                            Contraseña actualizada.
                        </p>
                    )}
                    <button className="btn" disabled={p.processing}>
                        Actualizar contraseña
                    </button>
                </form>
            </div>
        </Shell>
    );
}
