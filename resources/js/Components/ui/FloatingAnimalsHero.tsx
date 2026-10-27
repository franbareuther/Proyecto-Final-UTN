import { Link } from '@inertiajs/react';
import Icon from '@/Components/Icon';

const animals = [
    { image: 'golden-retriever-cara', position: 'golden' },
    { image: 'beagle-cara', position: 'beagle' },
    { image: 'border-collie-cara', position: 'collie' },
    { image: 'gato-gris-cara', position: 'tabby' },
    { image: 'gato-bicolor-cara', position: 'tuxedo' },
    { image: 'conejo-cara', position: 'rabbit' },
];

export default function FloatingAnimalsHero() {
    return (
        <section aria-labelledby="hero-title" className="floating-animals-hero">
            <div className="floating-hero-animals" aria-hidden="true">
                {animals.map((animal) => (
                    <div
                        key={animal.image}
                        className={`floating-hero-pet floating-hero-pet-${animal.position}`}
                    >
                        <img
                            src={`/images/hero/${animal.image}.webp`}
                            alt=""
                            width="512"
                            height="512"
                            decoding="async"
                        />
                    </div>
                ))}
            </div>
            <div className="floating-hero-copy">
                <h1 id="hero-title" className="floating-hero-heading">
                    Encontrá a tu próximo compañero de{' '}
                    <span className="hero-title-brand">
                        <Icon name="paw" className="h-[0.85em] w-[0.85em] shrink-0" />
                        <span>
                            <span className="hero-marker-underline">huellitas</span>.
                        </span>
                    </span>
                </h1>
                <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-stone-700 sm:text-lg">
                    Conectamos a familias con refugios de toda la red. Explorá los animales en
                    adopción, conocé la institución que los cuida y enviá tu solicitud al refugio
                    responsable.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                    <Link href="/animales" className="btn rounded-full">
                        Encontrá tu compañero <Icon name="arrow" className="h-5 w-5" />
                    </Link>
                    <a href="#como-funciona" className="btn-secondary rounded-full">
                        Cómo adoptar
                    </a>
                </div>
            </div>
        </section>
    );
}
