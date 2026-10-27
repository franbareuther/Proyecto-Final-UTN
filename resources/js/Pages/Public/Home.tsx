import { Head, Link } from '@inertiajs/react';
import { Animal, Refuge } from '@/types/shelter';
import { AnimalCard, Empty, Shell } from '@/Components/Shelter';
import FloatingAnimalsHero from '@/Components/ui/FloatingAnimalsHero';
import About from '@/Components/ui/About';
import Icon from '@/Components/Icon';
import ShelterImage from '@/Components/ShelterImage';

export default function Home({ animals, refuges = [] }: { animals: Animal[]; refuges?: Refuge[] }) {
    return (
        <Shell>
            <Head title="Encontrá a tu próximo compañero de huellitas" />
            <FloatingAnimalsHero />
            <About />
            <section aria-labelledby="featured-title" className="py-14 sm:py-20">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <h2 id="featured-title" className="section-heading">
                            Buscan un lugar en tu vida.
                        </h2>
                        <p className="mt-4 max-w-xl leading-relaxed text-stone-600">
                            Conocé sus personalidades, sus cuidados y todo lo que los hace únicos.
                        </p>
                    </div>
                    <Link href="/animales" className="text-link">
                        Ver todos los animales <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                </div>
                {animals.length ? (
                    <div className="companions-grid">
                        {animals.map((a) => (
                            <AnimalCard key={a.id} animal={a} compact />
                        ))}
                    </div>
                ) : (
                    <Empty>
                        Pronto vas a conocer a los animales de la red. Mientras tanto, descubrí cómo
                        funciona la adopción.
                    </Empty>
                )}
            </section>
            <section aria-labelledby="refuges-title" className="pb-14 sm:pb-20">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <h2 id="refuges-title" className="section-heading">
                        Conocé los refugios
                    </h2>
                    <Link className="text-link" href="/refugios">
                        Ver todos los refugios →
                    </Link>
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                    {refuges.map((s) => (
                        <Link
                            key={s.id}
                            className="card hover:border-emerald-800"
                            href={`/refugios/${s.slug}`}
                        >
                            <ShelterImage
                                src={s.image_url}
                                name={s.name}
                                kind={s.image_type}
                                className="mb-4"
                            />
                            <h3 className="text-2xl font-semibold">{s.name}</h3>
                            <p className="mt-2 text-sm text-stone-600">{s.city || 'Red Huellitas'}</p>
                            <p className="mt-4 text-sm text-emerald-800">
                                Conocer su historia y sus animales →
                            </p>
                        </Link>
                    ))}
                </div>
                {!refuges.length && <Empty>Pronto conocerás los refugios de nuestra red.</Empty>}
            </section>
        </Shell>
    );
}
