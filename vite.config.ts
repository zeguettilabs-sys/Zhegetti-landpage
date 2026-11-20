import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

interface ServiceData {
  id: string;
  name: string;
  path: string;
  category: string;
  description: string;
  caption: string;
}

interface SiteData {
  brand: string;
  tagline: string;
  services: ServiceData[];
  siteConfig: { email: string | null };
}

const PHONES = ['+51 922 040 557', '+51 907 136 664', '+51 948 792 314'];

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * SEO generado desde data/servicios.json en cada compilacion:
 *  - reemplaza __SITE_URL__ en index.html,
 *  - inserta los datos estructurados (schema.org) y un contenido <noscript> con
 *    los servicios y canales de contacto, para bots que no ejecutan JavaScript,
 *  - publica sitemap.xml, robots.txt y un 404.html (necesario en GitHub Pages
 *    para que las rutas de la SPA carguen al entrar directo o recargar).
 */
function seoPlugin(siteUrl: string): Plugin {
  const data = JSON.parse(readFileSync(new URL('./data/servicios.json', import.meta.url), 'utf8')) as SiteData;
  const email = data.siteConfig.email ?? 'contacto@zeguetti.com';
  // La vitrina es ilustrativa: no va al sitemap y lleva noindex
  const routes = ['/', '/nosotros', '/contacto', ...data.services.map((s) => s.path)];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': `${siteUrl}/#empresa`,
        name: data.brand,
        url: `${siteUrl}/`,
        logo: `${siteUrl}/assets/logo-zeguetti.png`,
        image: `${siteUrl}/og-image.jpg`,
        description: data.tagline,
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
          name: 'Servicios de desarrollo de software',
          itemListElement: data.services.map((s) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: s.name,
              description: s.description,
              url: `${siteUrl}${s.path}`,
            },
          })),
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#sitio`,
        url: `${siteUrl}/`,
        name: data.brand,
        inLanguage: 'es-PE',
        publisher: { '@id': `${siteUrl}/#empresa` },
      },
    ],
  };

  const noscript = `<noscript>
      <main class="noscript-seo">
        <h1>${esc(data.brand)}: ${esc(data.tagline)}</h1>
        <h2>Servicios</h2>
        <ul>
${data.services
  .map((s) => `          <li><a href="${s.path}">${esc(s.name)}</a>: ${esc(s.caption)}</li>`)
  .join('\n')}
        </ul>
        <h2>Contacto</h2>
        <p>Cotiza con un asesor por WhatsApp: ${PHONES.map(esc).join(' · ')}. Correo: <a href="mailto:${email}">${email}</a>.</p>
        <p><a href="/nosotros">Nosotros</a> · <a href="/contacto">Contacto</a></p>
      </main>
    </noscript>`;

  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) =>
      `  <url><loc>${siteUrl}${r}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${
        r === '/' ? '1.0' : r.startsWith('/servicios/') ? '0.9' : '0.7'
      }</priority></url>`
  )
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
    transformIndexHtml(html) {
      return html
        .replaceAll('__SITE_URL__', siteUrl)
        .replace('<!--seo:jsonld-->', `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`)
        .replace('<!--seo:noscript-->', noscript);
    },
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
    },
    closeBundle() {
      const index = resolve(outDir, 'index.html');
      if (outDir && existsSync(index)) copyFileSync(index, resolve(outDir, '404.html'));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL || 'https://zeguetti.com').replace(/\/+$/, '');

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
