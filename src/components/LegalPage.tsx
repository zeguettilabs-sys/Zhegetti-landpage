import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useSeo } from '../seo/useSeo';
import { CrtShell } from './CrtShell';
import { Header } from './Header';

interface LegalPageProps {
  heading: string;
  seo: Parameters<typeof useSeo>[0];
  children: ReactNode;
}

export function LegalPage({ heading, seo, children }: LegalPageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { pathname } = useLocation();
  useSeo(seo);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    headingRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <CrtShell>
      <Header />
      <main id="main-content" className="subpage-shell legal-page">
        <h1 ref={headingRef} tabIndex={-1} className="section-heading">{heading}</h1>
        {children}
      </main>
    </CrtShell>
  );
}
