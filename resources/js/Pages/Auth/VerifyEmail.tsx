import { Head, Link, useForm } from '@inertiajs/react';
import { Errors, Shell, Title } from '@/Components/Shelter';
export default function VerifyEmail({ status }: { status?: string }) {
    const f = useForm({});
    return (
        <Shell>
            <Head title="Verificar correo" />
            <div className="mx-auto max-w-lg">
                <Title
                    title="Verificá tu correo"
                    text="Abrí el enlace del correo de verificación. Si no llegó, revisá la carpeta de correo no deseado o pedí otro enlace."
                />
                <form
                    className="card space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        f.post('/email/verification-notification');
                    }}
                >
                    <Errors errors={f.errors} />
                    {status === 'verification-link-sent' && (
                        <p role="status" className="text-emerald-900">
                            Enviamos un nuevo enlace de verificación.
                        </p>
                    )}
                    <button className="btn" disabled={f.processing}>
                        Reenviar enlace de verificación
                    </button>
                    <Link href="/logout" method="post" as="button" className="btn-secondary">
                        Cerrar sesión
                    </Link>
                </form>
            </div>
        </Shell>
    );
}
