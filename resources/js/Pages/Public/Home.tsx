import { Head, Link } from '@inertiajs/react';
import { Animal, Refuge } from '@/types/shelter';
import { AnimalCard, Empty, Shell } from '@/Components/Shelter';
import FloatingAnimalsHero from '@/Components/ui/FloatingAnimalsHero';
import Icon from '@/Components/Icon';
import ShelterImage from '@/Components/ShelterImage';

export default function Home({ animals, refuges = [] }: { animals: Animal[]; refuges?: Refuge[] }) {
    return (
        <Shell>
            <Head title="Encontrá a tu próximo compañero de huellas" />
            <FloatingAnimalsHero />
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
                            <p className="mt-2 text-sm text-stone-600">{s.city || 'Red Huella'}</p>
                            <p className="mt-4 text-sm text-emerald-800">
                                Conocer su historia y sus animales →
                            </p>
                        </Link>
                    ))}
                </div>
                {!refuges.length && <Empty>Pronto conocerás los refugios de nuestra red.</Empty>}
            </section>
            <section
                id="como-funciona"
                aria-labelledby="process-title"
                className="rounded-[1.75rem] bg-huella-forest px-6 py-10 text-white sm:rounded-[2.5rem] sm:p-12"
            >
                <div className="max-w-2xl">
                    <h2 id="process-title" className="section-heading text-white">
                        Adoptar es un compromiso.
                        <br />
                        <span className="font-medium text-[#efdbc0]">
                            Y no tenés que hacerlo solo.
                        </span>
                    </h2>
                </div>
                <ol className="mt-10 grid gap-8 lg:grid-cols-3">
                    {[
                        {
                            number: '01',
                            title: 'Encontrá esa conexión',
                            text: 'Explorá los animales de la red o elegí un refugio y conocé la historia, personalidad y cuidados de cada animal.',
                        },
                        {
                            number: '02',
                            title: 'Contanos sobre vos',
                            text: 'Creá tu cuenta y completá la solicitud. El refugio responsable del animal la recibe y evalúa para acompañar una adopción responsable.',
                        },
                        {
                            number: '03',
                            title: 'Escribamos el próximo capítulo',
                            text: 'El refugio evalúa la solicitud, coordina los siguientes pasos y registra la adopción cuando se concreta.',
                        },
                    ].map((step) => (
                        <li key={step.number} className="border-t border-white/25 pt-6">
                            <span className="font-display text-4xl text-[#efdbc0]">
                                {step.number}
                            </span>
                            <h3 className="mt-5 text-2xl font-semibold">{step.title}</h3>
                            <p className="mt-3 leading-relaxed text-emerald-100">{step.text}</p>
                        </li>
                    ))}
                </ol>
            </section>
            <section
                id="nosotros"
                aria-labelledby="about-title"
                className="grid items-start gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_1.15fr]"
            >
                <div>
                    <span className="mb-5 inline-flex rounded-2xl bg-[#efe9dc] p-3 text-[#885039]">
                        <Icon name="leaf" className="h-7 w-7" />
                    </span>
                    <h2 id="about-title" className="section-heading">
                        El destino es
                        <br />
                        <span className="font-medium text-huella-clay">un hogar.</span>
                    </h2>
                </div>
                <div className="min-w-0">
                    <p className="reading-copy text-lg leading-relaxed text-stone-700">
                        Huella conecta a familias con refugios de la red. Cada institución cuida a
                        sus animales, informa sobre sus necesidades y evalúa las solicitudes de
                        adopción. La plataforma permite conocerlos y seguir ese recorrido.
                    </p>
                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-stone-200 bg-white p-5">
                            <Icon name="home" className="h-6 w-6 text-emerald-800" />
                            <h3 className="mt-4 font-semibold text-emerald-950">
                                Un hogar, a su medida
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-stone-600">
                                Cada animal tiene necesidades y una personalidad que merece ser
                                conocida.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-white p-5">
                            <Icon name="paw" className="h-6 w-6 text-emerald-800" />
                            <h3 className="mt-4 font-semibold text-emerald-950">
                                Un vínculo para toda la vida
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-stone-600">
                                Promovemos decisiones conscientes y el cuidado responsable de los
                                animales.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </Shell>
    );
}
