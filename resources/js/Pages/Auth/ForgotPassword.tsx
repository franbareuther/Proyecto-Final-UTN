import { Head, Link, useForm } from '@inertiajs/react';
import { Errors, Field, Shell } from '@/Components/Shelter';
import AuthLayout from '@/Components/AuthLayout';

export default function ForgotPassword({ status }: { status?: string }) {
    const f = useForm({ email: '' });
    return (
        <Shell>
            <Head title="Recuperar contraseña" />
            <AuthLayout
                title="¿Olvidaste tu contraseña?"
                text="Escribí el correo de tu cuenta y te enviamos un enlace para elegir una nueva."
            >
                <form
                    className="card space-y-5 sm:p-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.post('/forgot-password');
                    }}
                >
                    {status && (
                        <p
                            role="status"
                            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-950"
                        >
                            {status}
                        </p>
                    )}
                    <Errors errors={f.errors} />
                    <Field label="Correo electrónico" error={f.errors.email}>
                        <input
                            type="email"
                            autoComplete="email"
                            required
                            autoFocus
                            value={f.data.email}
                            onChange={(e) => f.setData('email', e.target.value)}
                        />
                    </Field>
                    <button className="btn w-full" disabled={f.processing}>
                        {f.processing ? 'Enviando…' : 'Enviar enlace'}
                    </button>
                    <p className="text-center text-sm text-stone-500">
                        ¿La recordaste?{' '}
                        <Link className="text-emerald-800 underline" href="/login">
                            Volver a Ingresar
                        </Link>
                    </p>
                </form>
            </AuthLayout>
        </Shell>
    );
}
