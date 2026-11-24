import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { activePromo, brandName, rawSiteConfig, services } from './src/data/services';
import {
  aboutSeo,
  contactSeo,
  homeSeo,
  INDEX_ROBOTS,
  NOINDEX_ROBOTS,
  notFoundSeo,
  serviceSeo,
  showcaseSeo,
  libroSeo,
  privacidadSeo,
  terminosSeo,
} from './src/seo/metadata';

interface PageSeo {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}

const PHONES = ['+51 922 040 557', '+51 907 136 664', '+51 948 792 314'];

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Genera un HTML por ruta con sus metadatos y el mismo bundle de React.
 * Las fichas ocultas no generan HTML ni aparecen en el mapa del sitio.
 */
function seoPlugin(siteUrl: string): Plugin {
  const email = rawSiteConfig.email ?? 'contacto@zeguetti.com';
  const home = homeSeo();
  const pages: PageSeo[] = [
    home,
    aboutSeo,
    contactSeo,
    terminosSeo,
    privacidadSeo,
    libroSeo,
    ...services.map(serviceSeo),
    showcaseSeo,
    { ...notFoundSeo, path: '/404' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': `${siteUrl}/#empresa`,
        name: brandName,
        url: `${siteUrl}/`,
        logo: `${siteUrl}/icon-512.png`,
        image: `${siteUrl}/og-image.jpg`,
        description: home.description,
        email,
        telephone: PHONES[0],
        areaServed: { '@type': 'Country', name: 'Perú' },
        address: { '@type': 'PostalAddress', addressCountry: 'PE' },
        contactPoint: PHONES.map((telephone) => ({
          '@type': 'ContactPoint',
          telephone,
          contactType: 'sales',
          areaServed: 'PE',
          availableLanguage: ['es'],
        })),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Servicios web de Zeguetti',
          itemListElement: services.map((s) => {
            const promo = activePromo(s);
            return {
              '@type': 'Offer',
              ...(promo
                ? {
                    price: String(promo.price),
                    priceCurrency: promo.currency,
                    ...(promo.validUntil ? { priceValidUntil: promo.validUntil } : {}),
                    description: promo.includes.join(' · '),
                  }
                : {}),
              itemOffered: {
                '@type': 'Service',
                name: s.name,
                description: s.description,
                url: `${siteUrl}${s.path}`,
              },
            };
          }),
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#sitio`,
        url: `${siteUrl}/`,
        name: brandName,
        inLanguage: 'es-PE',
        publisher: { '@id': `${siteUrl}/#empresa` },
      },
    ],
  };

  const homeContent = `<h2>Servicios</h2>
        <ul>
${services
  .map((s) => `          <li><a href="${esc(s.path)}">${esc(s.name)}</a>: ${esc(s.caption)}</li>`)
  .join('\n')}
        </ul>`;

  function renderPage(html: string, page: PageSeo) {
    const isHome = page.path === '/';
    const url = esc(`${siteUrl}${page.path}`);
    const title = esc(page.title);
    const description = esc(page.description);
    const noscript = `<noscript>
      <main class="noscript-seo">
        <h1>${isHome ? esc('Diseño web y landing pages en Perú') : title}</h1>
        <p>${description}</p>
        ${isHome ? homeContent : ''}
        <p><a href="/">Inicio</a> · <a href="/nosotros">Nosotros</a> · <a href="/contacto">Contacto</a></p>
        <p>WhatsApp: ${PHONES.map(esc).join(' · ')}. Correo: <a href="mailto:${esc(email)}">${esc(email)}</a>.</p>
      </main>
    </noscript>`;

    return html
      .replaceAll('__SITE_URL__', () => esc(siteUrl))
      .replaceAll('__SEO_TITLE__', () => title)
      .replaceAll('__SEO_DESCRIPTION__', () => description)
      .replaceAll('__SEO_URL__', () => url)
      .replaceAll('__SEO_ROBOTS__', page.noindex ? NOINDEX_ROBOTS : INDEX_ROBOTS)
      .replace('<!--seo:canonical-->', () => page.path === '/404' ? '' : `<link rel="canonical" href="${url}" />`)
      .replace('<!--seo:jsonld-->', () => isHome
        ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>`
        : '')
      .replace('<!--seo:noscript-->', () => noscript);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter((page) => !page.noindex)
  .map((page) => `  <url><loc>${esc(`${siteUrl}${page.path}`)}</loc></url>`)
  .join('\n')}
</urlset>
`;
  const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  let outDir = '';

  return {
    name: 'zeguetti-seo',
    transformIndexHtml(html, context) {
      return context.server ? renderPage(html, home) : html;
    },
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
    },
    writeBundle() {
      const html = readFileSync(resolve(outDir, 'index.html'), 'utf8');
      for (const page of pages) {
        const file = resolve(outDir, page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, renderPage(html, page));
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL || 'https://www.zeguetti.com').replace(/\/+$/, '');

  return {
    plugins: [react(), seoPlugin(siteUrl)],
    build: {
      rollupOptions: {
        output: {
          // Librerias en archivos aparte: se cachean entre versiones del sitio
          manualChunks: {
            three: ['three'],
            react: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
  };
});
