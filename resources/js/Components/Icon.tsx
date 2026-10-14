import { SVGProps } from 'react';

type Name =
    | 'paw'
    | 'arrow'
    | 'menu'
    | 'close'
    | 'search'
    | 'filter'
    | 'check'
    | 'leaf'
    | 'home'
    | 'chevron'
    | 'heart';

export default function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: Name }) {
    const paths: Record<Exclude<Name, 'paw'>, string> = {
        arrow: 'M5 12h14m-6-6 6 6-6 6',
        menu: 'M4 6h16M4 12h16M4 18h16',
        close: 'm6 6 12 12M6 18 18 6',
        search: 'm16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
        filter: 'M4 6h16M7 12h10M10 18h4',
        check: 'm5 12 4 4L19 6',
        leaf: 'M20 3C8 2 2 9 6 16c7 5 15-2 14-13ZM5 21 16 9',
        home: 'm3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7',
        chevron: 'm9 5 7 7-7 7',
        heart: 'M12 21 3.5 12.5C-2 6 6 0 12 6c6-6 14 0 8.5 6.5Z',
    };
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            {name === 'paw' ? (
                <>
                    <ellipse cx="5" cy="8" rx="2" ry="3" transform="rotate(-25 5 8)" />
                    <ellipse cx="10" cy="5" rx="2" ry="3" />
                    <ellipse cx="16" cy="5" rx="2" ry="3" />
                    <ellipse cx="21" cy="9" rx="2" ry="3" transform="rotate(25 21 9)" />
                    <path d="M5 18c0-3 4-8 7-8s7 5 7 8c0 5-5 1-7 1s-7 4-7-1Z" />
                </>
            ) : (
                <path d={paths[name]} />
            )}
        </svg>
    );
}
