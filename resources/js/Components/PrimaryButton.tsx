import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button {...props} className={'btn ' + className} disabled={disabled}>
            {children}
        </button>
    );
}
