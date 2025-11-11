import { ButtonHTMLAttributes, KeyboardEvent } from 'react';
import type { MouseEvent } from 'react';
import { Link } from '@/app/i18n/navigation';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  target?: string;
  rel?: string;
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  href,
  target,
  rel,
  onClick,
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-full font-medium transition-colors inline-flex w-fit items-center justify-center gap-2';

  const variantStyles = {
    primary: 'bg-gold-primary text-gray-900 hover:bg-gold-highlight !bg-[#D4AF37] !text-gray-900',
    secondary: 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-600',
    outline: 'border border-solid border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'
  };

  const sizeStyles = {
    sm: 'text-sm h-8 px-3',
    md: 'text-base h-10 px-4',
    lg: 'text-lg h-12 px-6'
  };

  const disabledStyles = 'disabled:opacity-50 disabled:bg-gold-primary disabled:text-black';
  const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`;

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const syntheticEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      onClick?.(syntheticEvent as unknown as MouseEvent<HTMLButtonElement>);
    }
  };

  if (href) {
    return (
      <Link href={href} className={styles} target={target} rel={rel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={styles}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </button>
  );
}
