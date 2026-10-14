import { ButtonHTMLAttributes } from 'react';

export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                'inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-900 disabled:opacity-60 ' +
                className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
