# Zeguetti — Sitio web

Sitio de **Zeguetti** para diseño web y landing pages a medida en Perú.
La interfaz imita un televisor CRT con carátulas VHS en 3D, cambio de canal entre páginas y un panel para cotizar con un asesor por WhatsApp o correo.

**Stack:** React 19 · TypeScript · Vite 6 · React Router 7 · three.js · Playwright (pruebas E2E).

## Requisitos

- Node.js `>= 20` y `npm`.

```bash
npm install
npm run dev        # desarrollo en http://127.0.0.1:5173
npm run build      # comprobación de tipos + build de producción en dist/
npm run preview    # sirve dist/ en http://127.0.0.1:4173
npm run test:e2e   # pruebas E2E (Playwright)
```

## Rutas

| Ruta | Contenido |
| --- | --- |
| `/` | Carrusel 3D de servicios en el televisor. |
| `/servicios/aplicaciones-web` | Redirección permanente a la ficha de Landing pages. |
| `/servicios/landing-pages` | Ficha de Landing pages, con el ejemplo publicado [dalenabogada.com](https://www.dalenabogada.com/). |
| `/nosotros` | Perfil con funda VHS en 3D y texto en carrete. |
| `/vitrina` | Globo 3D con tarjetas (contenido ilustrativo, `noindex`; solo escritorio). |
| `/contacto` | Panel de asesores: WhatsApp, llamada y correo. |
| `*` | Pantalla "sin señal" (404). |

## Modo ahorro (equipos de poca potencia)

El pie de pantalla tiene un interruptor **AHORRO [ON/OFF]**. En modo ahorro se apaga el 3D (WebGL), la curvatura del texto, el grano y el temblor de cinta, el cambio de canal y las animaciones; el carrusel pasa a ser plano. La CPU del navegador baja de ~4 % a ~0 % y se usa menos memoria.

- Lo que elige el visitante se guarda (`zeguetti-lite`) y manda siempre.
- Sin elección, se activa solo en equipos de gama baja (≤ 2 GB de RAM, ≤ 2 núcleos, celular con ≤ 4 núcleos y ≤ 4 GB, "ahorro de datos" o red 2G) o si la web va a menos de ~30 cuadros por segundo.
- La lógica está en `src/hooks/useLite.ts`; el `index.html` aplica la clase `lite` antes de pintar.

## Dónde se editan los datos

- **Mostrar u ocultar un servicio.** Configura `"visible": false` en `data/servicios.json` para retirar la ficha del sitio, del sitemap y de los datos estructurados. Para volver a mostrarla, borra la línea o pon `true`. Si vuelves a activar Aplicaciones web, retira su redirección en `vercel.json`, `public/_redirects` y `src/pages/ServicePage.tsx`.
- **Servicios y textos:** `data/servicios.json` (para sumar un servicio, añade un objeto; el campo opcional `example` muestra un proyecto publicado en su ficha).
- **Asesores (WhatsApp):** `src/config/advisors.ts`.
- **Correo y datos generales:** `siteConfig` en `data/servicios.json`.

## SEO

- Título, descripción, URL canónica, Open Graph y Twitter Card por ruta. El build genera el HTML con los metadatos de `src/seo/metadata.ts`. `src/seo/useSeo.ts` aplica esos metadatos durante la navegación interna.
- Datos estructurados schema.org: `ProfessionalService` con catálogo de servicios y puntos de contacto (en `index.html`), y `Service` + `BreadcrumbList` en cada ficha.
- En cada build se generan `sitemap.xml`, `robots.txt` y `404.html` desde `data/servicios.json` (plugin en `vite.config.ts`), además de un contenido `<noscript>` con servicios y contacto.
- Imagen para compartir `public/og-image.jpg` (1200×630), íconos y `site.webmanifest`.

La dirección pública se define con la variable `VITE_SITE_URL` (por defecto `https://www.zeguetti.com`). Copia `.env.example` a `.env` o pásala al compilar:

```bash
VITE_SITE_URL=https://www.zeguetti.com npm run build
```

Después de publicar, registra el sitio y envía `https://<tu-dominio>/sitemap.xml` en Google Search Console.

## Despliegue

Es una SPA estática: publica la carpeta `dist/`.

- **Netlify:** ya incluye `public/_redirects`.
- **Vercel.** `vercel.json` sirve los archivos HTML con URL sin extensión y usa `404.html` para las rutas retiradas o desconocidas.
- **GitHub Pages.** El build incluye páginas HTML por ruta y `404.html`. Para desplegar en `usuario.github.io/repositorio`, configura `base` en Vite y `basename` en el router.
