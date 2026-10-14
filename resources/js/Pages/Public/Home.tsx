import { Head, Link } from '@inertiajs/react';
import { Animal } from '@/types/shelter';
import { AnimalCard, Empty, Shell } from '@/Components/Shelter';
export default function Home({ animals }: { animals: Animal[] }) {
    return (
        <Shell>
            <Head title="Un hogar cambia todo" />
            <section className="grid items-center gap-10 pb-16 pt-2 lg:grid-cols-2">
                <div>
                    <p className="eyebrow">UNA NUEVA HISTORIA EMPIEZA CON VOS</p>
                    <h1 className="mt-6 text-5xl font-semibold leading-[1.08] tracking-tight text-emerald-950 md:text-7xl">
                        Un hogar.
                        <br />
                        Una familia.
                        <br />
                        <span className="font-serif italic text-emerald-700">Toda una vida.</span>
                    </h1>
                    <p className="my-7 max-w-md text-lg leading-relaxed text-stone-500">
                        Hay un compañero esperando conocerte. Abrí tu casa a la adopción responsable
                        y escriban juntos su próxima historia.
                    </p>
                    <Link href="/animales" className="btn">
                        Encontrá tu compañero <span aria-hidden="true">↗</span>
                    </Link>
                    <p className="mt-6 text-sm text-stone-500">
                        Acompañamos cada paso de la adopción.
                    </p>
                </div>
                <div className="relative">
                    <img
                        src={animals[0]?.photo_url || '/images/animal-placeholder.svg'}
                        alt={
                            animals[0]
                                ? `${animals[0].name}, esperando una familia`
                                : 'Una nueva historia en el refugio'
                        }
                        className="h-[450px] w-full rounded-[2.5rem] object-cover md:h-[540px]"
                    />
                    <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-5 shadow-sm">
                        <p className="text-lg font-semibold">
                            {animals[0]
                                ? `Conocé a ${animals[0].name}`
                                : 'El amor también se adopta'}
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                            Una oportunidad puede cambiarlo todo.
                        </p>
                    </div>
                </div>
            </section>
            <section className="border-t border-stone-200 py-14">
                <div className="mb-8 flex flex-wrap justify-between gap-4">
                    <div>
                        <p className="eyebrow">PEQUEÑAS HUELLAS, GRANDES HISTORIAS</p>
                        <h2 className="mt-3 text-3xl font-semibold">Están buscando su lugar</h2>
                    </div>
                    <Link
                        href="/animales"
                        className="self-end text-sm font-semibold text-emerald-800"
                    >
                        Ver todos los animales →
                    </Link>
                </div>
                {animals.length ? (
                    <div className="grid gap-6 md:grid-cols-3">
                        {animals.map((a) => (
                            <AnimalCard key={a.id} animal={a} />
                        ))}
                    </div>
                ) : (
                    <Empty>Pronto vas a conocer a los animales del refugio.</Empty>
                )}
            </section>
            <section
                id="como-funciona"
                className="scroll-mt-6 rounded-[2rem] bg-emerald-950 p-8 text-white md:p-12"
            >
                <p className="text-xs tracking-widest text-emerald-200">
                    UN ENCUENTRO QUE CAMBIA DOS VIDAS
                </p>
                <h2 className="mt-3 text-3xl font-semibold">Adoptar es un camino compartido.</h2>
                <div className="mt-10 grid gap-10 md:grid-cols-3">
                    {[
                        [
                            '01',
                            'Conocé a tu compañero',
                            'Explorá sus perfiles, su personalidad y los cuidados que necesita.',
                        ],
                        [
                            '02',
                            'Contanos sobre vos',
                            'Creá tu cuenta y completá la solicitud. Queremos encontrar una buena familia para cada animal.',
                        ],
                        [
                            '03',
                            'Construyamos una nueva historia',
                            'El refugio evalúa tu solicitud, coordina el encuentro y registra la adopción.',
                        ],
                    ].map(([n, t, d]) => (
                        <div key={n}>
                            <span className="font-serif text-4xl text-emerald-300">{n}</span>
                            <h3 className="mb-3 mt-5 text-xl font-semibold">{t}</h3>
                            <p className="leading-relaxed text-emerald-100/80">{d}</p>
                        </div>
                    ))}
                </div>
            </section>
            <section id="nosotros" className="grid gap-8 py-16 md:grid-cols-2">
                <h2 className="max-w-md text-4xl font-semibold leading-tight">
                    Un refugio es el comienzo.
                    <br />
                    <span className="font-serif italic text-emerald-700">
                        El destino es un hogar.
                    </span>
                </h2>
                <p className="self-center text-lg leading-relaxed text-stone-500">
                    En Huella creemos en las segundas oportunidades. Cuidamos, acompañamos y
                    trabajamos para que cada animal encuentre una familia que lo quiera y respete
                    durante toda su vida. La adopción es un compromiso responsable.
                </p>
            </section>
        </Shell>
    );
}
