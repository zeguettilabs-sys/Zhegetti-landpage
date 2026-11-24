import { useRef, type ReactNode } from 'react';
import { useCrtWarp } from '../hooks/useCrtWarp';
import { CrtTubeLayers } from './CrtTube';
import { LegalFooter } from './LegalFooter';

interface CrtShellProps {
  children: ReactNode;
  variant?: 'tv-home' | 'scrollable';
  introStep?: 0 | 1 | 2 | 3;
}

export function CrtShell({
  children,
  variant = 'scrollable',
  introStep = 3,
}: CrtShellProps) {
  const screenRef = useRef<HTMLDivElement | null>(null);
  useCrtWarp(screenRef);

  return (
    <div className="crt-outer">
      <div
        ref={screenRef}
        className={`crt-screen${variant === 'tv-home' ? ' crt-screen--home' : ''}`}
        data-intro-step={variant === 'tv-home' ? introStep : undefined}
      >
        <a className="skip-link" href="#main-content">
          Saltar al contenido
        </a>
        <div className="crt-screen__glare" aria-hidden="true" />
        <div className="crt-screen__scanlines" aria-hidden="true" />
        <div className="crt-content">
          {children}
          <LegalFooter />
        </div>
        <CrtTubeLayers />
      </div>
    </div>
  );
}
