import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { siteConfig } from '../config/site';
import { brandName, services } from '../data/services';
import { VcrTimecode } from './VcrStatus';

interface HeaderProps {
  activeServiceId?: string;
}

export function Header({ activeServiceId }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const homeState = activeServiceId ? { activeServiceId } : undefined;

  return (
    <header className="site-header">
      <div className="header-left">
        <Link
          to="/"
          state={homeState}
          className="header-nav-link header-home-pill"
          aria-current={isHome && !location.hash ? 'page' : undefined}
          onClick={() => {
            if (isHome) {
              window.scrollTo({ top: 0 });
            }
          }}
        >
          INICIO
        </Link>
        <VcrTimecode className="header-edition" />
      </div>

      <Link
        to="/"
        state={homeState}
        className="header-brand"
        aria-label={`${brandName} — Ir al inicio`}
        onClick={() => {
          if (isHome) {
            window.scrollTo({ top: 0 });
          }
        }}
      >
        <span className="header-brand__logo-wrap">
          {/* Franjas RGB detras del monograma, como la etiqueta de color de una cinta */}
          <span className="header-brand__bands" aria-hidden="true" />
          <img
            src="/assets/logo-zeguetti-alpha.png"
            alt={`Logo de ${brandName}`}
            width={90}
            height={75}
            className="header-brand__logo"
          />
        </span>
        <span className="header-brand__rule" aria-hidden="true" />
        <span className="header-brand__meta" aria-hidden="true">
          <span>{brandName.toUpperCase()}</span>
          <span>{siteConfig.edition}</span>
        </span>
      </Link>

      <nav className="header-right" aria-label="Navegación principal">
        <Link to="/" state={homeState} className="header-nav-link">
          SERVICIOS
        </Link>
        <Link
          to="/nosotros"
          state={homeState}
          className="header-nav-link"
          aria-current={location.pathname === '/nosotros' ? 'page' : undefined}
        >
          NOSOTROS
        </Link>
        <Link
          to="/vitrina"
          state={homeState}
          className="header-nav-link"
          aria-current={location.pathname === '/vitrina' ? 'page' : undefined}
        >
          VITRINA
        </Link>
        <Link
          to="/contacto"
          state={homeState}
          className="header-nav-link"
          aria-current={location.pathname === '/contacto' ? 'page' : undefined}
        >
          CONTACTO
        </Link>
      </nav>

      <button
        type="button"
        className="header-mobile-toggle"
        aria-expanded={menuOpen}
        aria-controls="mobile-nav-drawer"
        aria-label={menuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {menuOpen ? '[ CERRAR ]' : '[ MENÚ ]'}
      </button>

      <nav
        id="mobile-nav-drawer"
        className="mobile-drawer"
        data-open={menuOpen ? 'true' : 'false'}
        aria-label="Navegación móvil"
        hidden={!menuOpen}
        style={{ gridColumn: '1 / -1' }}
      >
        <Link
          to="/"
          state={homeState}
          className="mobile-drawer__link"
          onClick={() => setMenuOpen(false)}
        >
          <span>SERVICIOS</span>
          <span>{services.length > 1 ? `01–${String(services.length).padStart(2, '0')}` : '01'}</span>
        </Link>
        <Link
          to="/nosotros"
          state={homeState}
          className="mobile-drawer__link"
          onClick={() => setMenuOpen(false)}
        >
          <span>NOSOTROS</span>
          <span>→</span>
        </Link>
        <Link
          to="/contacto"
          state={homeState}
          className="mobile-drawer__link"
          onClick={() => setMenuOpen(false)}
        >
          <span>CONTACTO</span>
          <span>→</span>
        </Link>
        <div className="mobile-drawer__meta">
          {brandName.toUpperCase()} · EST. {siteConfig.edition} · {siteConfig.locationLabel.toUpperCase()}
        </div>
      </nav>
    </header>
  );
}
