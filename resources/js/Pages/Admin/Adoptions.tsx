import { Head, Link } from '@inertiajs/react';
import { Adoption, Page } from '@/types/shelter';
import { date, Empty, Pagination, Shell, Title } from '@/Components/Shelter';
import { openChat } from '@/Components/ChatBubble';
export default function Adoptions({ adoptions }: { adoptions: Page<Adoption> }) {
    return (
        <Shell internal>
            <Head title="Adopciones" />
            <Title
                title="Historias que encontraron hogar"
                text="Registro de adopciones definitivas del refugio."
            />
            {adoptions.data.length ? (
                <div className="grid gap-5 md:grid-cols-2">
                    {adoptions.data.map((a) => (
                        <article key={a.id} className="card flex gap-5">
                            <img
                                src={a.animal.photo_url}
                                alt={a.animal.name}
                                className="h-24 w-24 rounded-xl object-cover"
                            />
                            <div>
                                <h2 className="text-xl font-semibold">{a.animal.name}</h2>
                                <p className="mt-1 text-sm">
                                    Familia de {a.user.name} {a.user.last_name}
                                </p>
                                <p className="mt-2 text-sm text-stone-500">
                                    Adopción #{a.id} · {date(a.adoption_date)}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                                    <Link
                                        className="text-link"
                                        href={`/adopciones/${a.id}/seguimiento`}
                                    >
                                        Ver seguimiento
                                    </Link>
                                    <button
                                        type="button"
                                        className="text-link"
                                        onClick={() =>
                                            a.adoption_request_id && openChat(a.adoption_request_id)
                                        }
                                    >
                                        Abrir chat
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <Empty>Todavía no se registraron adopciones definitivas.</Empty>
            )}
            <Pagination page={adoptions} />
        </Shell>
    );
}
