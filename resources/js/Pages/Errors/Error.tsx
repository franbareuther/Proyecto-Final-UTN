import { Head, Link, usePage } from '@inertiajs/react';
import { Shell } from '@/Components/Shelter';
import Icon from '@/Components/Icon';
import { Shared } from '@/types/shelter';

type Copy = { label: string; title: string; text: string; image: string; retry?: boolean };

const copies: Record<number, Copy> = {
    403: {
        label: 'Acceso restringido',
        title: 'Esta sección no está disponible para tu cuenta.',
        text: 'Cada refugio ve solo su propia información y algunas pantallas son exclusivas del equipo. Si creés que es un error, ingresá con la cuenta correspondiente.',
        image: 'border-collie-cara.webp',
    },
    404: {
        label: 'Página no encontrada',
        title: 'Esta huellita se perdió en el camino.',
        text: 'Puede que el enlace esté mal escrito o que la página ya no exista. Si buscabas a un animal, quizás ya encontró su hogar.',
        image: 'gato-gris-cara.webp',
    },
    429: {
        label: 'Demasiados intentos',
        title: 'Tomemos un respiro.',
        text: 'Recibimos muchos pedidos seguidos desde tu conexión. Esperá un minuto y volvé a intentarlo.',
        image: 'conejo-cara.webp',
        retry: true,
    },
    500: {
        label: 'Error del servidor',
        title: 'Algo salió mal de nuestro lado.',
        text: 'No fue tu culpa. Probá de nuevo en unos minutos; si el problema sigue, escribinos desde el formulario de contacto.',
        image: 'beagle-cara.webp',
        retry: true,
    },
    503: {
        label: 'En mantenimiento',
        title: 'Estamos acomodando las cuchas.',
        text: 'Huellita está en mantenimiento por unos minutos. Los animales, las solicitudes y los historiales siguen a salvo.',
        image: 'golden-retriever-cara.webp',
        retry: true,
    },
};

export default function ErrorPage({ status }: { status: number }) {
    const { auth } = usePage<Shared>().props;
    const copy = copies[status] ?? copies[500];
    return (
        <Shell backdrop>
            <Head title={copy.label} />
            <section
                aria-labelledby="error-title"
                className="mx-auto flex max-w-2xl flex-col items-center py-8 text-center sm:py-14"
            >
                <img
                    src={`/images/hero/${copy.image}`}
                    alt=""
                    width="160"
                    height="160"
                    className="h-28 w-28 object-contain sm:h-40 sm:w-40"
                />
                <p className="mt-6 text-sm font-semibold text-huella-clay">
                    Error {status} · {copy.label}
                </p>
                <h1
                    id="error-title"
                    className="mt-3 text-balance text-3xl font-semibold tracking-tight text-emerald-950 sm:text-5xl"
                >
                    {copy.title}
                </h1>
                <p className="mt-4 max-w-xl leading-relaxed text-stone-600">{copy.text}</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {copy.retry ? (
                        <button
                            type="button"
                            className="btn"
                            onClick={() => window.location.reload()}
                        >
                            Intentar de nuevo
                        </button>
                    ) : (
                        <Link className="btn" href="/">
                            Ir al inicio <Icon name="arrow" className="h-4 w-4" />
                        </Link>
                    )}
                    {status === 404 && (
                        <Link className="btn-secondary" href="/animales">
                            Ver animales en adopción
                        </Link>
                    )}
                    {status === 403 &&
                        (auth.user ? (
                            <Link className="btn-secondary" href="/dashboard">
                                Ir a mi espacio
                            </Link>
                        ) : (
                            <Link className="btn-secondary" href="/login">
                                Ingresar
                            </Link>
                        ))}
                    {copy.retry && (
                        <Link className="btn-secondary" href="/">
                            Ir al inicio
                        </Link>
                    )}
                </div>
            </section>
        </Shell>
    );
}
