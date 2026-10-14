import { ImgHTMLAttributes } from 'react';

export default function AnimalImage({
    src,
    alt,
    loading = 'lazy',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    const fallback = '/images/animal-placeholder.svg';
    return (
        <img
            {...props}
            src={src || fallback}
            alt={alt}
            loading={loading}
            decoding="async"
            onError={(event) => {
                if (event.currentTarget.getAttribute('src') !== fallback)
                    event.currentTarget.src = fallback;
            }}
        />
    );
}
