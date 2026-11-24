import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PENDIENTE, promoLanding } from '../src/config/legal';

const dist = resolve('dist');
const site = 'https://www.zeguetti.com';
const todayInLima = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
const promoEnLima = promoLanding.vigencia === PENDIENTE || todayInLima <= promoLanding.vigencia;

const pages = [
  {
    file: 'index.html',
    title: 'Diseño web y landing pages en Perú | Zeguetti',
    description: promoEnLima
      ? 'El diseño web que tu negocio merecía. Landing pages en Perú desde S/ 100 con dominio por 1 año, mantenimiento por 1 año y SEO básico.'
      : 'El diseño web que tu negocio merecía. Creamos tu página web o landing page a medida, adaptada a celulares y con contacto por WhatsApp.',
    canonical: `${site}/`,
  },
  {
    file: 'nosotros.html',
    title: 'Nosotros | Diseño web en Perú | Zeguetti',
    description: 'Conoce cómo Zeguetti diseña y desarrolla landing pages y páginas web a medida para negocios en Perú.',
    canonical: `${site}/nosotros`,
  },
  {
    file: 'contacto.html',
    title: 'Cotiza tu página web o landing page | Zeguetti',
    description: 'Cotiza el diseño de tu página web o landing page con Zeguetti por WhatsApp o correo.',
    canonical: `${site}/contacto`,
  },
  {
    file: 'terminos.html',
    title: 'Términos de uso | Zeguetti',
    description: 'Consulta los términos de uso de Zeguetti y las condiciones generales de sus ofertas de diseño web.',
    canonical: `${site}/terminos`,
  },
  {
    file: 'privacidad.html',
    title: 'Política de privacidad | Zeguetti',
    description: 'Conoce cómo Zeguetti trata tus datos personales y cómo puedes ejercer tus derechos de privacidad en Perú.',
    canonical: `${site}/privacidad`,
  },
  {
    file: 'libro-de-reclamaciones.html',
    title: 'Libro de Reclamaciones | Zeguetti',
    description: 'Accede al Libro de Reclamaciones virtual de Zeguetti para presentar un reclamo o una queja.',
    canonical: `${site}/libro-de-reclamaciones`,
  },
  {
    file: 'vitrina.html',
    title: 'Vitrina — Zeguetti',
    description: 'Vitrina de diseño web de Zeguetti.',
    canonical: `${site}/vitrina`,
    noindex: true,
  },
  {
    file: 'servicios/landing-pages.html',
    title: 'Diseño de landing pages para tu negocio | Zeguetti',
    description: promoEnLima
      ? 'Diseñamos tu landing page desde S/ 100 con dominio por 1 año, mantenimiento por 1 año y SEO básico. Presenta tu negocio y recibe consultas por WhatsApp.'
      : 'Diseñamos tu landing page a medida, optimizada para buscadores, para presentar tu negocio y recibir consultas por WhatsApp desde cualquier dispositivo.',
    canonical: `${site}/servicios/landing-pages`,
  },
  {
    file: '404.html',
    title: 'Página no encontrada — Zeguetti',
    description: 'La dirección que buscas no existe. Vuelve al inicio para ver los servicios de Zeguetti.',
    canonical: null,
    noindex: true,
  },
];

test('El HTML de dist contiene los metadatos de cada ruta', async ({ page }) => {
  for (const expected of pages) {
    await test.step(expected.file, async () => {
      const html = readFileSync(resolve(dist, expected.file), 'utf8');
      const meta = await page.evaluate((source) => {
        const doc = new DOMParser().parseFromString(source, 'text/html');
        return {
          title: doc.title,
          description: doc.head.querySelector('meta[name="description"]')?.getAttribute('content'),
          canonical: doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
          robots: doc.head.querySelector('meta[name="robots"]')?.getAttribute('content'),
        };
      }, html);
      expect(meta).toEqual({
        title: expected.title,
        description: expected.description,
        canonical: expected.canonical,
        robots: expected.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
      });
    });
  }
});

test('El build omite las fichas ocultas', () => {
  for (const slug of ['sistemas-a-medida', 'aplicaciones-web', 'automatizacion', 'integraciones-apis']) {
    expect(existsSync(resolve(dist, 'servicios', `${slug}.html`)), slug).toBe(false);
    expect(existsSync(resolve(dist, 'servicios', slug, 'index.html')), slug).toBe(false);
  }
});

test('El sitemap de dist contiene las rutas públicas indexables, incluidas las legales', async ({ page }) => {
  const xml = readFileSync(resolve(dist, 'sitemap.xml'), 'utf8');
  const urls = await page.evaluate((source) => {
    const doc = new DOMParser().parseFromString(source, 'application/xml');
    return Array.from(doc.querySelectorAll('urlset > url > loc'), (loc) => loc.textContent);
  }, xml);
  expect(urls.sort()).toEqual([
    `${site}/`,
    `${site}/contacto`,
    `${site}/libro-de-reclamaciones`,
    `${site}/nosotros`,
    `${site}/privacidad`,
    `${site}/servicios/landing-pages`,
    `${site}/terminos`,
  ]);
});
