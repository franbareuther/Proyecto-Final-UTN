import { Head, Link, useForm } from '@inertiajs/react';
import { Shell } from '@/Components/Shelter';
import AuthLayout from '@/Components/AuthLayout';

export default function VerifyEmail({ status }: { status?: string }) {
    const f = useForm({});
    return (
        <Shell>
            <Head title="Verificar correo" />
            <AuthLayout
                title="Verificá tu correo."
                text="¡Gracias por registrarte! Antes de empezar, confirmá tu correo con el enlace que te enviamos. Si no te llegó, te mandamos otro."
            >
                <form
                    className="card space-y-5 sm:p-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.post('/email/verification-notification');
                    }}
                >
                    {status === 'verification-link-sent' && (
                        <p
                            role="status"
                            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-950"
                        >
                            Te enviamos un nuevo enlace de verificación al correo con el que te
                            registraste.
                        </p>
                    )}
                    <button className="btn w-full" disabled={f.processing}>
                        {f.processing ? 'Enviando…' : 'Reenviar correo de verificación'}
                    </button>
                    <p className="text-center text-sm text-stone-500">
                        ¿Te equivocaste de cuenta?{' '}
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="text-emerald-800 underline"
                        >
                            Salir
                        </Link>
                    </p>
                </form>
            </AuthLayout>
        </Shell>
    );
}
