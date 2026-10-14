import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-stone-300 text-emerald-800 shadow-sm focus:ring-emerald-800 ' +
                className
            }
        />
    );
}
