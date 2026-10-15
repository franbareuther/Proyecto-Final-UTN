import { Head, Link } from '@inertiajs/react';
import AnimalImage from '@/Components/AnimalImage';
import { Adoption, Page } from '@/types/shelter';
import { date, Empty, Pagination, Shell, Title } from '@/Components/Shelter';
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
                        <article key={a.id} className="card flex flex-wrap gap-5">
                            <AnimalImage
                                src={a.animal.photo_url}
                                alt={a.animal.name}
                                className="h-24 w-24 rounded-xl object-cover"
                            />
                            <div className="min-w-0 break-words">
                                <h2 className="text-xl font-semibold">{a.animal.name}</h2>
                                <p className="text-sm text-emerald-800">{a.animal.shelter?.name}</p>
                                <p className="mt-1 text-sm">
                                    Familia de {a.user.name} {a.user.last_name}
                                </p>
                                {a.adoption_request_id && (
                                    <Link
                                        className="text-link mt-3"
                                        href={`/solicitudes/${a.adoption_request_id}`}
                                    >
                                        Ver solicitud e historial
                                    </Link>
                                )}
                                <p className="mt-2 text-sm text-stone-500">
                                    Adopción #{a.id} · {date(a.adoption_date)}
                                </p>
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
