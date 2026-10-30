import { Head, Link, useForm } from '@inertiajs/react';
import { Errors, Field, Shell } from '@/Components/Shelter';
import AuthLayout from '@/Components/AuthLayout';
export default function Register() {
    const f = useForm({
        name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    return (
        <Shell>
            <Head title="Crear cuenta" />
            <AuthLayout
                title="Tu próxima historia empieza acá."
                text="Creá tu cuenta para solicitar una adopción."
            >
                <form
                    className="card space-y-5 sm:p-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.post('/register', {
                            onSuccess: () => f.reset('password', 'password_confirmation'),
                            onError: () => document.getElementById('registration-errors')?.scrollIntoView({ block: 'center' }),
                        });
                    }}
                >
                    <div id="registration-errors" aria-live="polite">
                        <Errors errors={f.errors} />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        {(
                            [
                                ['name', 'Nombre', 'text', 'given-name', ''],
                                ['last_name', 'Apellido', 'text', 'family-name', ''],
                                ['email', 'Correo electrónico', 'email', 'email', 'sm:col-span-2'],
                                ['password', 'Contraseña', 'password', 'new-password', ''],
                                [
                                    'password_confirmation',
                                    'Confirmar contraseña',
                                    'password',
                                    'new-password',
                                    '',
                                ],
                            ] as const
                        ).map(([k, l, t, ac, span]) => (
                            <div key={k} className={span}>
                                <Field label={l} error={f.errors[k]}>
                                    <input
                                        type={t}
                                        autoComplete={ac}
                                        required
                                        minLength={t === 'password' ? 8 : undefined}
                                        value={f.data[k]}
                                        onChange={(e) => f.setData(k, e.target.value)}
                                    />
                                </Field>
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-stone-600">Usá al menos 8 caracteres y repetí la misma contraseña.</p>
                    <button className="btn w-full" disabled={f.processing}>
                        {f.processing ? 'Creando cuenta…' : 'Crear cuenta'}
                    </button>
                    <p className="text-center text-sm text-stone-500">
                        ¿Ya tenés cuenta?{' '}
                        <Link className="text-emerald-800 underline" href="/login">
                            Ingresá
                        </Link>
                    </p>
                    <p className="text-center text-sm text-stone-500">
                        ¿Representás a un refugio?{' '}
                        <Link className="text-emerald-800 underline" href="/registro-refugio">
                            Registrá tu refugio
                        </Link>
                    </p>
                </form>
            </AuthLayout>
        </Shell>
    );
}
