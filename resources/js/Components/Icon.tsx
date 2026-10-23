import { SVGProps } from 'react';

export type IconName =
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
    | 'heart'
    | 'dashboard'
    | 'building'
    | 'clipboard'
    | 'calendar'
    | 'medical'
    | 'user'
    | 'logout'
    | 'sidebar';

export default function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
    const paths: Record<Exclude<IconName, 'paw'>, string> = {
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
        dashboard: 'M4 4h6v6H4V4Zm10 0h6v10h-6V4ZM4 14h6v6H4v-6Zm10 4h6v2h-6v-2Z',
        building: 'M4 21V5l8-3 8 3v16M8 8h1m6 0h1M8 12h1m6 0h1M8 16h1m6 0h1M10 21v-3h4v3',
        clipboard: 'M9 5H6a2 2 0 0 0-2 2v13h16V7a2 2 0 0 0-2-2h-3M9 3h6v4H9V3Zm0 9h6m-6 4h6',
        calendar: 'M5 3v3m14-3v3M3 9h18M5 5h14a2 2 0 0 1 2 2v14H3V7a2 2 0 0 1 2-2Z',
        medical: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z',
        user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
        logout: 'M10 5H5v14h5m4-4 4-3-4-3m4 3H9',
        sidebar: 'M4 4h16v16H4V4Zm6 0v16m4-12 4 4-4 4',
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
