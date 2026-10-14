import { Head, Link } from '@inertiajs/react';
import { Animal } from '@/types/shelter';
import { AnimalCard, Badge, Empty, Shell } from '@/Components/Shelter';
import AnimalImage from '@/Components/AnimalImage';
import Icon from '@/Components/Icon';

export default function Home({ animals }: { animals: Animal[] }) {
    const featured = animals[0];
    return (
        <Shell>
            <Head title="Un encuentro puede cambiarlo todo" />
            <section
                aria-labelledby="hero-title"
                className="public-hero items-center overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem]"
            >
                <div className="hero-copy min-w-0 py-3 sm:py-6">
                    <p className="eyebrow flex items-center gap-2">
                        <Icon name="paw" className="h-4 w-4 shrink-0" />
                        Segundas oportunidades, nuevas historias
                    </p>
                    <h1 id="hero-title" className="hero-heading mt-5">
                        Un encuentro.
                        <br />
                        Un compañero.
                        <br />
                        <span className="font-serif italic font-normal text-huella-clay">
                            Toda una vida.
                        </span>
                    </h1>
                    <p className="reading-copy mt-6 text-base leading-relaxed text-stone-700 sm:text-lg">
                        Hay una historia esperando cruzarse con la tuya. Elegí un refugio de nuestra
                        red y encontrá a tu próximo compañero.
                    </p>
                    <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                        <Link href="/refugios" className="btn">
                            Encontrá tu compañero <Icon name="arrow" className="h-5 w-5" />
                        </Link>
                        <a href="#como-funciona" className="text-link">
                            Cómo adoptar
                        </a>
                    </div>
                    <p className="mt-7 flex items-start gap-2 text-sm leading-relaxed text-emerald-900">
                        <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />
                        Te acompañamos en cada paso de una adopción responsable.
                    </p>
                </div>
                <div className="relative min-w-0">
                    <div
                        aria-hidden="true"
                        className="absolute -right-4 -top-4 h-24 w-24 rounded-full border border-emerald-900/15 sm:h-36 sm:w-36"
                    />
                    <AnimalImage
                        src={featured?.photo_url}
                        alt={
                            featured
                                ? `${featured.name}, esperando una familia`
                                : 'Una nueva historia en el refugio'
                        }
                        loading="eager"
                        className="hero-photo relative rounded-[1.5rem] bg-[#e2e9db]"
                    />
                    <div className="relative mx-3 -mt-16 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:mx-5 sm:p-5">
                        <p className="eyebrow">
                            {featured
                                ? 'Podría ser el comienzo de algo lindo'
                                : 'El amor también se adopta'}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                            {featured ? (
                                <Link
                                    href={'/animales/' + featured.id}
                                    className="inline-flex min-h-11 min-w-0 items-center gap-3 text-xl font-semibold text-emerald-950"
                                >
                                    <span className="break-words">Conocé a {featured.name}</span>
                                    <Icon name="arrow" className="h-5 w-5 shrink-0" />
                                </Link>
                            ) : (
                                <p className="text-lg font-semibold text-emerald-950">
                                    Un hogar cambia todo.
                                </p>
                            )}
                            {featured && <Badge>{featured.availability_status}</Badge>}
                        </div>
                    </div>
                </div>
            </section>
            <section aria-labelledby="featured-title" className="py-14 sm:py-20">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="eyebrow">Pequeñas huellas, grandes historias</p>
                        <h2 id="featured-title" className="section-heading mt-3">
                            Buscan un lugar en tu vida.
                        </h2>
                        <p className="mt-4 max-w-xl leading-relaxed text-stone-600">
                            Conocé sus personalidades, sus cuidados y todo lo que los hace únicos.
                        </p>
                    </div>
                    <Link href="/refugios" className="text-link">
                        Conocer los refugios <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                </div>
                {animals.length ? (
                    <div className="animal-grid">
                        {animals.map((a) => (
                            <AnimalCard key={a.id} animal={a} />
                        ))}
                    </div>
                ) : (
                    <Empty>
                        Pronto vas a conocer a los animales del refugio. Mientras tanto, descubrí
                        cómo funciona la adopción.
                    </Empty>
                )}
            </section>
            <section
                id="como-funciona"
                aria-labelledby="process-title"
                className="rounded-[1.75rem] bg-huella-forest px-6 py-10 text-white sm:rounded-[2.5rem] sm:p-12"
            >
                <div className="max-w-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-emerald-200">
                        El camino hacia una nueva familia
                    </p>
                    <h2
                        id="process-title"
                        className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
                    >
                        Adoptar es un compromiso.
                        <br />
                        <span className="font-serif italic font-normal text-[#efdbc0]">
                            Y no tenés que hacerlo solo.
                        </span>
                    </h2>
                </div>
                <ol className="mt-10 grid gap-8 lg:grid-cols-3">
                    {[
                        {
                            number: '01',
                            title: 'Encontrá esa conexión',
                            text: 'Elegí un refugio, explorá su catálogo y conocé la historia, personalidad y cuidados de cada animal.',
                        },
                        {
                            number: '02',
                            title: 'Contanos sobre vos',
                            text: 'Creá tu cuenta y completá la solicitud. Conocer tu hogar nos ayuda a acompañar una adopción responsable.',
                        },
                        {
                            number: '03',
                            title: 'Escribamos el próximo capítulo',
                            text: 'El refugio evalúa la solicitud, coordina los siguientes pasos y registra la adopción cuando se concreta.',
                        },
                    ].map((step) => (
                        <li key={step.number} className="border-t border-white/25 pt-6">
                            <span className="font-serif text-4xl text-[#efdbc0]">
                                {step.number}
                            </span>
                            <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
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
                    <p className="eyebrow">El refugio es solo el comienzo</p>
                    <h2 id="about-title" className="section-heading mt-3">
                        El destino es
                        <br />
                        <span className="font-serif italic font-normal text-huella-clay">
                            un hogar.
                        </span>
                    </h2>
                </div>
                <div className="min-w-0">
                    <p className="reading-copy text-lg leading-relaxed text-stone-700">
                        En la red Huella creemos en las segundas oportunidades. Cuidamos y
                        acompañamos a cada animal mientras encuentra una familia que respete sus
                        tiempos y lo quiera durante toda su vida.
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
