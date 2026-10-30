import { PropsWithChildren } from 'react';
import Icon from '@/Components/Icon';
import { Title } from '@/Components/Shelter';

// Dos columnas en pantallas grandes: presentación a la izquierda y formulario a la derecha.
export default function AuthLayout({
    title,
    text,
    image,
    imageAlt,
    points,
    children,
}: PropsWithChildren<{
    title: string;
    text: string;
    image: string;
    imageAlt: string;
    points: string[];
}>) {
    return (
        <div className="mx-auto grid w-full max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
            <div className="min-w-0 lg:sticky lg:top-28">
                <Title title={title} text={text} />
                <figure className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white sm:block">
                    <img
                        src={image}
                        alt={imageAlt}
                        className="h-56 w-full object-cover lg:h-72"
                        width="800"
                        height="533"
                        loading="lazy"
                        decoding="async"
                    />
                </figure>
                <ul className="mt-6 space-y-3">
                    {points.map((point) => (
                        <li
                            key={point}
                            className="flex items-start gap-3 text-sm leading-relaxed text-stone-700"
                        >
                            <Icon name="paw" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
                            {point}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="min-w-0">{children}</div>
        </div>
    );
}
