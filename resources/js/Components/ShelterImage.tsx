import { useState } from 'react';
import Icon from '@/Components/Icon';

export default function ShelterImage({
    src,
    name,
    kind = 'photo',
    className = '',
}: {
    src?: string | null;
    name: string;
    kind?: 'photo' | 'logo';
    className?: string;
}) {
    const [failedSource, setFailedSource] = useState<string | null>(null);
    const visible = src && failedSource !== src;
    return (
        <div
            className={`relative aspect-[16/9] w-full min-w-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 ${className}`}
        >
            {visible ? (
                <img
                    src={src}
                    alt={`${kind === 'logo' ? 'Logo' : 'Fotografía'} de ${name}`}
                    loading="lazy"
                    decoding="async"
                    className={`absolute inset-0 h-full w-full ${kind === 'logo' ? 'object-contain p-5' : 'object-cover'}`}
                    onError={() => setFailedSource(src)}
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-stone-600">
                    <Icon name="home" className="h-8 w-8 text-emerald-800" />
                    <span className="text-sm">
                        {src ? 'Imagen no disponible' : 'Refugio de la red Huella'}
                    </span>
                </div>
            )}
        </div>
    );
}
