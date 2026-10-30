import { PropsWithChildren } from 'react';
import { Title } from '@/Components/Shelter';

// Dos columnas en pantallas grandes: título a la izquierda y formulario a la derecha.
export default function AuthLayout({
    title,
    text,
    children,
}: PropsWithChildren<{ title: string; text: string }>) {
    return (
        <div className="mx-auto grid w-full max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
            <div className="min-w-0 lg:sticky lg:top-28">
                <Title title={title} text={text} />
            </div>
            <div className="min-w-0">{children}</div>
        </div>
    );
}
