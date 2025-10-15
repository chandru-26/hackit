import React from 'react';

export default function Button({ children, onClick, className, variant = 'default', size = 'default', ...props }) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';

  const variants = {
    default: 'accent-btn',
    outline: 'border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(44,154,255,0.04)] text-[var(--text-primary)]',
  };

  const sizes = {
    default: 'h-10 py-2 px-4',
    lg: 'h-11 px-8',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className || ''}`;

  return (
    <button className={classes} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
