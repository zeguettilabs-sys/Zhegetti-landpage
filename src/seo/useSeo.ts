import { useEffect } from 'react';
import { brandName } from '../data/services';

/**
 * Direccion publica del sitio (sin "/" final). Se cambia con la variable de entorno
 * VITE_SITE_URL al compilar, por ejemplo: VITE_SITE_URL=https://zeguetti.com npm run build
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://zeguetti.com').replace(/\/+$/, '');
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SeoOptions {
  /** Titulo completo de la pestaña y de la vista previa al compartir. */
  title: string;
  description: string;
  /** Ruta canonica, por ejemplo "/servicios/landing-pages". */
  path: string;
  /** Paginas que no deben aparecer en Google (404, contenido de demostracion). */
  noindex?: boolean;
  /** Datos estructurados propios de la pagina (schema.org). */
  jsonLd?: Record<string, unknown> | null;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Titulo, descripcion, URL canonica, Open Graph / Twitter y datos estructurados
 * de cada ruta. Google ejecuta JavaScript, asi que cada pagina queda con sus
 * propias etiquetas; el index.html trae las de la portada por si un bot no lo hace.
 */
export function useSeo({ title, description, path, noindex = false, jsonLd = null }: SeoOptions) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const url = `${SITE_URL}${path === '/' ? '/' : path}`;
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:site_name', brandName);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setCanonical(url);

    const old = document.getElementById('ld-page');
    old?.remove();
    if (ld) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'ld-page';
      script.textContent = ld;
      document.head.appendChild(script);
    }
    return () => {
      document.getElementById('ld-page')?.remove();
    };
  }, [title, description, path, noindex, ld]);
}
