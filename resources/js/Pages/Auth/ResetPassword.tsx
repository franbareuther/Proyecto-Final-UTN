import { Head, useForm } from '@inertiajs/react';
import { Errors, Field, Shell } from '@/Components/Shelter';
import AuthLayout from '@/Components/AuthLayout';

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    const f = useForm({ token, email, password: '', password_confirmation: '' });
    return (
        <Shell>
            <Head title="Restablecer contraseña" />
            <AuthLayout
                title="Elegí una nueva contraseña."
                text="Usá al menos 8 caracteres. Después vas a poder ingresar con ella."
            >
                <form
                    className="card space-y-5 sm:p-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.post('/reset-password', {
                            onFinish: () => f.reset('password', 'password_confirmation'),
                        });
                    }}
                >
                    <Errors errors={f.errors} />
                    <Field label="Correo electrónico" error={f.errors.email}>
                        <input
                            type="email"
                            autoComplete="username"
                            required
                            value={f.data.email}
                            onChange={(e) => f.setData('email', e.target.value)}
                        />
                    </Field>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Nueva contraseña" error={f.errors.password}>
                            <input
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                autoFocus
                                value={f.data.password}
                                onChange={(e) => f.setData('password', e.target.value)}
                            />
                        </Field>
                        <Field label="Confirmar contraseña" error={f.errors.password_confirmation}>
                            <input
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                value={f.data.password_confirmation}
                                onChange={(e) => f.setData('password_confirmation', e.target.value)}
                            />
                        </Field>
                    </div>
                    <button className="btn w-full" disabled={f.processing}>
                        {f.processing ? 'Guardando…' : 'Guardar nueva contraseña'}
                    </button>
                </form>
            </AuthLayout>
        </Shell>
    );
}
