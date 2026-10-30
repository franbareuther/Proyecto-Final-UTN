import { Head, Link, useForm } from '@inertiajs/react';
import { Errors, Field, Shell, Title } from '@/Components/Shelter';
export default function Login({ status }: { status?: string }) {
    const f = useForm({ email: '', password: '', remember: false });
    return (
        <Shell>
            <Head title="Ingresar" />
            <div className="mx-auto max-w-lg">
                <Title
                    title="Qué bueno volver a verte."
                    text="Ingresá para continuar tu historia con el refugio."
                />
                {status && (
                    <p role="status" className="mb-4">
                        {status}
                    </p>
                )}
                <form
                    className="card space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.post('/login', { onFinish: () => f.reset('password') });
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
                    <Field label="Contraseña" error={f.errors.password}>
                        <input
                            type="password"
                            autoComplete="current-password"
                            required
                            value={f.data.password}
                            onChange={(e) => f.setData('password', e.target.value)}
                        />
                    </Field>
                    <label className="flex items-center gap-3 text-sm">
                        <input
                            type="checkbox"
                            checked={f.data.remember}
                            onChange={(e) => f.setData('remember', e.target.checked)}
                        />
                        Recordarme
                    </label>
                    <button className="btn w-full" disabled={f.processing}>
                        {f.processing ? 'Ingresando…' : 'Ingresar'}
                    </button>
                    <div className="flex flex-wrap justify-between gap-3 text-sm">
                        <Link href="/forgot-password" className="text-emerald-800 underline">
                            Olvidé mi contraseña
                        </Link>
                        <Link href="/register" className="text-emerald-800 underline">
                            Crear cuenta
                        </Link>
                    </div>
                    <p className="border-t border-stone-100 pt-4 text-center text-sm text-stone-500">
                        ¿Tu refugio todavía no está en Huellita?{' '}
                        <Link href="/registro-refugio" className="text-emerald-800 underline">
                            Registralo
                        </Link>
                    </p>
                </form>
            </div>
        </Shell>
    );
}
