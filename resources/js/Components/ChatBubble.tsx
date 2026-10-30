import axios from 'axios';
import { Link, usePage } from '@inertiajs/react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ChatConversation, ChatSummary, Shared } from '@/types/shelter';
import Icon from '@/Components/Icon';

const OPEN_EVENT = 'huellita:open-chat';
const STORAGE_KEY = 'huellita-chat';
// Sin servidor de tiempo real: la burbuja consulta cada pocos segundos mientras la pestaña está visible.
const LIST_MS = 15000;
const CONVERSATION_MS = 6000;

/** Abre la burbuja directamente en la conversación de una solicitud. */
export const openChat = (requestId: number) =>
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: requestId }));

const when = (value: string) =>
    new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export function Conversation({
    conversation: c,
    userId,
    admin,
    sending,
    error,
    onSend,
    onLeave,
}: {
    conversation: ChatConversation;
    userId: number;
    admin: boolean;
    sending: boolean;
    error: string | null;
    onSend: (body: string) => Promise<boolean>;
    /** Se llama al ir a otra página desde la conversación, para cerrar la burbuja. */
    onLeave?: () => void;
}) {
    const pending = c.followUpPending ?? 0;
    const [body, setBody] = useState('');
    const list = useRef<HTMLOListElement>(null);
    useEffect(() => {
        list.current?.scrollTo({ top: list.current.scrollHeight });
    }, [c.id, c.messages.length]);
    const send = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!body.trim() || sending) return;
        if (await onSend(body)) setBody('');
    };
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {(c.followUpUrl || c.preAdoption) && (
                <div className="flex items-center gap-3 border-b border-stone-200 bg-emerald-50/60 px-4 py-2">
                    <p
                        id={`follow-up-hint-${c.id}`}
                        className="min-w-0 flex-1 text-xs leading-snug text-emerald-950"
                    >
                        {!c.followUpUrl
                            ? 'Se habilita cuando se registre la adopción.'
                            : pending > 0
                              ? admin
                                  ? `${pending} ${pending === 1 ? 'control pendiente' : 'controles pendientes'} de la familia.`
                                  : `${pending} ${pending === 1 ? 'control listo' : 'controles listos'} para cargar fotos y vacunas.`
                              : 'Fotos de cada control y certificados de vacunas.'}
                    </p>
                    {c.followUpUrl ? (
                        <Link
                            href={c.followUpUrl}
                            onClick={onLeave}
                            className="btn relative shrink-0 px-4 py-2 text-sm"
                            aria-describedby={`follow-up-hint-${c.id}`}
                        >
                            Seguimiento
                            {pending > 0 && (
                                <span
                                    aria-hidden="true"
                                    className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#a34f32] px-1 text-[11px] font-bold text-white ring-2 ring-white"
                                >
                                    {pending}
                                </span>
                            )}
                        </Link>
                    ) : (
                        <button
                            type="button"
                            disabled
                            className="btn shrink-0 cursor-not-allowed px-4 py-2 text-sm opacity-50"
                            aria-describedby={`follow-up-hint-${c.id}`}
                        >
                            Seguimiento
                        </button>
                    )}
                </div>
            )}
            {c.deadline && c.preAdoption && (
                <p
                    role="status"
                    className="flex items-start gap-2 border-b border-amber-200 px-4 py-2 text-xs font-medium leading-relaxed text-amber-800"
                >
                    <Icon name="calendar" className="mt-0.5 h-4 w-4 shrink-0" />
                    {admin
                        ? `Esperando la respuesta de la familia hasta el ${when(c.deadline)}. Si no responde, la solicitud se cierra automáticamente.`
                        : `El refugio espera tu respuesta hasta el ${when(c.deadline)}. Si no respondés, la solicitud se finaliza y ${c.animal.name} podrá ser adoptado por otra familia.`}
                </p>
            )}
            <ol
                ref={list}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-stone-50 p-3"
                aria-live="polite"
                aria-label="Mensajes"
            >
                {c.messages.length === 0 && (
                    <li className="px-4 py-8 text-center text-sm text-stone-500">
                        {c.preAdoption
                            ? `Todavía no hay mensajes. Coordinen acá los próximos pasos; si el refugio escribe y no hay respuesta en ${c.limitHours} h, la solicitud se finaliza.`
                            : 'Todavía no hay mensajes.'}
                    </li>
                )}
                {c.messages.map((m) => {
                    if (m.type !== 'message') {
                        return (
                            <li
                                key={m.id}
                                className={
                                    'mx-auto max-w-prose px-2 text-center text-xs leading-relaxed ' +
                                    (m.type === 'warning'
                                        ? 'font-semibold text-amber-800'
                                        : 'text-stone-600')
                                }
                            >
                                <p>{m.body}</p>
                                <p className="mt-1 font-normal text-stone-500">
                                    Aviso automático · {when(m.created_at)}
                                </p>
                            </li>
                        );
                    }
                    const mine = m.user_id === userId;
                    return (
                        <li
                            key={m.id}
                            className={'flex ' + (mine ? 'justify-end' : 'justify-start')}
                        >
                            <div
                                className={
                                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ' +
                                    (mine
                                        ? 'rounded-br-md bg-emerald-900 text-white'
                                        : 'rounded-bl-md border border-stone-200 bg-white text-stone-800')
                                }
                            >
                                {!mine && (
                                    <p className="text-xs font-semibold text-emerald-800">
                                        {`${m.author?.name ?? ''} ${m.author?.last_name ?? ''}`.trim()}
                                        {m.author?.role === 'admin' ? ' · Refugio' : ''}
                                    </p>
                                )}
                                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                <p
                                    className={
                                        'mt-0.5 text-right text-[11px] ' +
                                        (mine ? 'text-emerald-100' : 'text-stone-500')
                                    }
                                >
                                    {when(m.created_at)}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
            {c.open ? (
                <form onSubmit={send} className="border-t border-stone-200 p-3">
                    <label htmlFor="chat-body" className="sr-only">
                        Escribir un mensaje
                    </label>
                    <div className="flex items-end gap-2">
                        <textarea
                            id="chat-body"
                            rows={1}
                            maxLength={2000}
                            placeholder="Escribí tu mensaje…"
                            className="max-h-32 min-h-10 flex-1 resize-none"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    send();
                                }
                            }}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? 'chat-error' : undefined}
                        />
                        <button
                            className="btn shrink-0 px-4"
                            disabled={sending || !body.trim()}
                            aria-label="Enviar mensaje"
                        >
                            <Icon name="arrow" className="h-4 w-4" />
                        </button>
                    </div>
                    {error && (
                        <p id="chat-error" role="alert" className="mt-2 text-xs text-red-800">
                            {error}
                        </p>
                    )}
                </form>
            ) : (
                <p className="border-t border-stone-200 p-3 text-xs text-stone-600">
                    La solicitud está cerrada. Podés leer la conversación, pero ya no se pueden
                    enviar mensajes.
                </p>
            )}
        </div>
    );
}

function Summary({
    item,
    admin,
    onOpen,
}: {
    item: ChatSummary;
    admin: boolean;
    onOpen: () => void;
}) {
    return (
        <li>
            <button
                type="button"
                onClick={onOpen}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-stone-50"
            >
                <img
                    src={item.animal.photo_url}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
                <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-semibold text-emerald-950">
                            {item.animal.name}
                        </span>
                        {item.last && (
                            <span className="shrink-0 text-[11px] text-stone-500">
                                {when(item.last.created_at)}
                            </span>
                        )}
                    </span>
                    <span className="block truncate text-xs text-stone-600">
                        {item.counterpart} · {item.status}
                    </span>
                    <span
                        className={
                            'mt-0.5 block truncate text-xs ' +
                            (item.last?.type === 'warning'
                                ? 'font-semibold text-amber-800'
                                : 'text-stone-500')
                        }
                    >
                        {item.last
                            ? (item.last.mine ? 'Vos: ' : '') + item.last.body
                            : 'Sin mensajes todavía'}
                    </span>
                    {item.deadline && (
                        <span className="mt-0.5 block text-[11px] font-semibold text-amber-800">
                            {admin
                                ? `Esperando respuesta · vence ${when(item.deadline)}`
                                : `Respondé antes del ${when(item.deadline)}`}
                        </span>
                    )}
                </span>
                {item.unread > 0 && (
                    <span
                        className="mt-1 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#a34f32] px-1.5 text-[11px] font-bold text-white"
                        aria-label={`${item.unread} sin leer`}
                    >
                        {item.unread}
                    </span>
                )}
            </button>
        </li>
    );
}

export default function ChatBubble() {
    const user = usePage<Shared>().props.auth.user;
    const admin = user?.role === 'admin';
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState<number | null>(null);
    const [list, setList] = useState<ChatSummary[] | null>(null);
    const [unread, setUnread] = useState(0);
    const [conversation, setConversation] = useState<ChatConversation | null>(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const toggle = useRef<HTMLButtonElement>(null);

    const loadList = useCallback(async () => {
        try {
            const { data } = await axios.get('/chats');
            setList(data.conversations);
            setUnread(data.unread);
        } catch {
            setList((current) => current ?? []);
        }
    }, []);
    const loadConversation = useCallback(async (id: number) => {
        try {
            const { data } = await axios.get(`/chats/${id}`);
            setConversation(data);
        } catch {
            setActive(null);
            setError('No se pudo abrir esa conversación.');
        }
    }, []);

    // La burbuja se vuelve a montar en cada página: recuerda si estaba abierta y en qué conversación.
    useEffect(() => {
        try {
            const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
            if (saved.open) setOpen(true);
            if (typeof saved.active === 'number') setActive(saved.active);
        } catch {
            /* almacenamiento no disponible */
        }
        const onOpen = (event: Event) => {
            setOpen(true);
            setError(null);
            setActive((event as CustomEvent<number>).detail);
        };
        window.addEventListener(OPEN_EVENT, onOpen);
        return () => window.removeEventListener(OPEN_EVENT, onOpen);
    }, []);
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ open, active }));
        } catch {
            /* almacenamiento no disponible */
        }
    }, [open, active]);
    useEffect(() => {
        if (open && active) loadConversation(active);
        else {
            setConversation(null);
            loadList();
        }
    }, [open, active, loadConversation, loadList]);
    useEffect(() => {
        const timer = window.setInterval(
            () => {
                if (document.visibilityState !== 'visible') return;
                if (open && active) loadConversation(active);
                else loadList();
            },
            open && active ? CONVERSATION_MS : LIST_MS,
        );
        return () => window.clearInterval(timer);
    }, [open, active, loadConversation, loadList]);
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
                toggle.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    if (!user) return null;
    const send = async (body: string) => {
        if (!active) return false;
        setSending(true);
        setError(null);
        try {
            const { data } = await axios.post(`/chats/${active}/mensajes`, { body });
            setConversation(data);
            return true;
        } catch (e) {
            const message = axios.isAxiosError(e) ? e.response?.data?.errors?.body?.[0] : null;
            setError(message || 'No se pudo enviar el mensaje. Intentá nuevamente.');
            return false;
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {open && (
                <section
                    role="dialog"
                    aria-label="Mensajes"
                    className="fixed inset-x-3 bottom-24 z-40 flex h-[min(36rem,calc(100svh-8rem))] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:w-[24rem]"
                >
                    <header className="flex items-center gap-3 border-b border-stone-200 px-4 py-3">
                        {active && conversation ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setActive(null)}
                                    className="rounded-full p-1.5 text-emerald-900 hover:bg-stone-100"
                                    aria-label="Volver a las conversaciones"
                                >
                                    <Icon name="chevron" className="h-4 w-4 rotate-180" />
                                </button>
                                <img
                                    src={conversation.animal.photo_url}
                                    alt=""
                                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-emerald-950">
                                        {conversation.animal.name}
                                    </p>
                                    <p className="truncate text-xs text-stone-600">
                                        {conversation.counterpart} · {conversation.status}
                                    </p>
                                </div>
                                <Link
                                    href={conversation.requestUrl}
                                    onClick={() => setOpen(false)}
                                    className="shrink-0 text-xs font-semibold text-emerald-800 underline"
                                >
                                    Solicitud
                                </Link>
                            </>
                        ) : (
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-emerald-950">
                                    {admin ? 'Conversaciones del refugio' : 'Tus adopciones'}
                                </p>
                                <p className="text-xs text-stone-600">
                                    {admin
                                        ? 'Familias con solicitudes en curso y adopciones.'
                                        : 'Hablá con el refugio de cada solicitud en curso o adopción.'}
                                </p>
                            </div>
                        )}
                    </header>
                    {active ? (
                        conversation ? (
                            <Conversation
                                conversation={conversation}
                                userId={user.id}
                                admin={admin}
                                sending={sending}
                                error={error}
                                onSend={send}
                                onLeave={() => setOpen(false)}
                            />
                        ) : (
                            <p className="p-6 text-center text-sm text-stone-500">
                                Cargando conversación…
                            </p>
                        )
                    ) : (
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {error && (
                                <p role="alert" className="px-4 pt-3 text-xs text-red-800">
                                    {error}
                                </p>
                            )}
                            {list === null ? (
                                <p className="p-6 text-center text-sm text-stone-500">Cargando…</p>
                            ) : list.length ? (
                                <ul className="divide-y divide-stone-100">
                                    {list.map((item) => (
                                        <Summary
                                            key={item.id}
                                            item={item}
                                            admin={admin}
                                            onOpen={() => {
                                                setError(null);
                                                setActive(item.id);
                                            }}
                                        />
                                    ))}
                                </ul>
                            ) : (
                                <p className="p-6 text-center text-sm leading-relaxed text-stone-500">
                                    {admin
                                        ? 'Todavía no hay conversaciones. Aparecen cuando una familia envía una solicitud.'
                                        : 'Cuando envíes una solicitud de adopción, vas a poder hablar con el refugio desde acá.'}
                                </p>
                            )}
                        </div>
                    )}
                </section>
            )}
            <button
                ref={toggle}
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-label={
                    open
                        ? 'Cerrar mensajes'
                        : `Abrir mensajes${unread ? `, ${unread} sin leer` : ''}`
                }
                className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900 text-white shadow-lg transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900 sm:right-6"
            >
                <Icon name={open ? 'close' : 'chat'} className="h-6 w-6" />
                {!open && unread > 0 && (
                    <span
                        aria-hidden="true"
                        className="absolute -right-1 -top-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#a34f32] px-1.5 text-xs font-bold text-white ring-2 ring-white"
                    >
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>
        </>
    );
}
