import { Head, Link, useForm } from '@inertiajs/react';
import { Errors, Field, Shell, Title } from '@/Components/Shelter';
export default function ResetPassword({ token, email }: { token: string; email: string }) {
    const f = useForm({ token, email: email || '', password: '', password_confirmation: '' });
    return (
        <Shell>
            <Head title="Nueva contraseña" />
            <div className="mx-auto max-w-lg">
                <Title
                    title="Elegí tu nueva contraseña"
                    text="Usá al menos 8 caracteres. El enlace solo puede usarse una vez."
                />
                <form
                    className="card space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.post('/reset-password', {
                            onFinish: () => f.reset('password', 'password_confirmation'),
                        });
                    }}
                >
                    <Errors errors={f.errors} />
                    {(
                        [
                            ['email', 'Correo electrónico', 'email'],
                            ['password', 'Nueva contraseña', 'password'],
                            ['password_confirmation', 'Confirmar contraseña', 'password'],
                        ] as const
                    ).map(([key, label, type]) => (
                        <Field key={key} label={label} error={f.errors[key]}>
                            <input
                                name={key}
                                type={type}
                                required
                                autoComplete={key === 'email' ? 'username' : 'new-password'}
                                minLength={type === 'password' ? 8 : undefined}
                                value={f.data[key]}
                                onChange={(e) => f.setData(key, e.target.value)}
                            />
                        </Field>
                    ))}
                    <button className="btn w-full" disabled={f.processing}>
                        {f.processing ? 'Guardando…' : 'Guardar nueva contraseña'}
                    </button>
                    <Link className="text-link" href="/forgot-password">
                        Solicitar otro enlace
                    </Link>
                </form>
            </div>
        </Shell>
    );
}
