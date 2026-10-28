import { Head } from '@inertiajs/react';
import { Empty, Pagination, Shell, Title } from '@/Components/Shelter';
import { Page } from '@/types/shelter';

type ContactMessage = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    created_at: string;
};

export default function Messages({ messages }: { messages: Page<ContactMessage> }) {
    return (
        <Shell internal>
            <Head title="Mensajes de contacto" />
            <Title
                title="Mensajes de contacto"
                text={`Consultas recibidas desde Contactanos. ${messages.total} ${messages.total === 1 ? 'mensaje' : 'mensajes'}.`}
            />
            {messages.data.length ? (
                <div className="space-y-4">
                    {messages.data.map((message) => (
                        <article key={message.id} className="card min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="text-lg font-semibold text-emerald-950">{message.subject}</h2>
                                    <p className="mt-1 break-words text-sm text-stone-600">
                                        {message.name} · {message.email}
                                    </p>
                                    <p className="mt-1 break-words text-sm text-stone-600">
                                        Teléfono: {message.phone || 'No informado'}
                                    </p>
                                </div>
                                <time dateTime={message.created_at} className="text-xs text-stone-500">
                                    {new Date(message.created_at).toLocaleString('es-AR', {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                    })}
                                </time>
                            </div>
                            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-700">
                                {message.message}
                            </p>
                        </article>
                    ))}
                </div>
            ) : (
                <Empty>Todavía no recibiste mensajes desde el formulario de contacto.</Empty>
            )}
            <Pagination page={messages} />
        </Shell>
    );
}
