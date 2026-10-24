import React from 'react';

interface BrandLogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

/**
 * Logotipo Oficial LINNK extraído da pasta /logo
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'dark',
  size = 'md',
}) => {
  const heightClass =
    size === 'sm' ? 'h-6' : size === 'lg' ? 'h-10' : 'h-8';

  const logoSrc =
    variant === 'dark' ? '/linnk-logo-dark.png' : '/linnk-logo-light.png';

  return (
    <div className="inline-flex items-center select-none">
      <img
        src={logoSrc}
        alt="linnk"
        className={`${heightClass} w-auto object-contain shrink-0`}
      />
    </div>
  );
};

