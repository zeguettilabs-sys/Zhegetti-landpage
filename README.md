# Zeguetti — Sitio web

Sitio de **Zeguetti** para diseño web y landing pages a medida en Perú.
La interfaz imita un televisor CRT con carátulas VHS en 3D, cambio de canal entre páginas y un panel para cotizar con un asesor por WhatsApp o correo.

**Stack:** React 19 · TypeScript · Vite 6 · React Router 7 · three.js · Playwright (pruebas E2E).

## Requisitos

- Node.js 20.19+, 22.13+ o 24+ y `npm`.

```bash
npm install
npm run dev        # desarrollo en http://127.0.0.1:5173
npm run build      # comprobación de tipos + build de producción en dist/
npm run lint       # ESLint para JavaScript y TypeScript
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
| `/terminos` | Términos de uso y condiciones generales de las ofertas. |
| `/privacidad` | Política de privacidad y derechos ARCO. |
| `/libro-de-reclamaciones` | Hoja virtual, registro y constancia imprimible. |
| `*` | Pantalla "sin señal" (404). |

## Modo ahorro (equipos de poca potencia)

El pie de pantalla tiene un interruptor **AHORRO [ON/OFF]**. En modo ahorro se apaga el 3D (WebGL), la curvatura del texto, el grano y el temblor de cinta, el cambio de canal y las animaciones; el carrusel pasa a ser plano. La CPU del navegador baja de ~4 % a ~0 % y se usa menos memoria.

- Lo que elige el visitante se guarda (`zeguetti-lite`) y manda siempre.
- Sin elección, se activa solo en equipos de gama baja (≤ 2 GB de RAM, ≤ 2 núcleos, celular con ≤ 4 núcleos y ≤ 4 GB, "ahorro de datos" o red 2G) o si la web va a menos de ~30 cuadros por segundo.
- La lógica está en `src/hooks/useLite.ts`; el `index.html` aplica la clase `lite` antes de pintar.

## Dónde se editan los datos

- **Mostrar u ocultar un servicio.** Configura `"visible": false` en `data/servicios.json` para retirar la ficha del sitio, del sitemap y de los datos estructurados. Para volver a mostrarla, borra la línea o pon `true`.
  - **Aplicaciones web.** La redirección a `/servicios/landing-pages` se usa mientras la ficha esté oculta. Si vuelve a mostrarse, elimina la regla de `/servicios/aplicaciones-web` en `vercel.json` y `public/_redirects` para que la URL sirva su propia ficha. Retira también la redirección del cliente en `src/pages/ServicePage.tsx`.
- **Servicios y textos:** `data/servicios.json` (para sumar un servicio, añade un objeto; el campo opcional `example` muestra un proyecto publicado en su ficha).
- **Asesores (WhatsApp):** `src/config/advisors.ts`.
- **Correo y datos generales:** `siteConfig` en `data/servicios.json`.
- Edita los **datos legales y la promoción de landing pages** en `src/config/legal.ts`. Completa los valores `[PENDIENTE]`. Indica el tratamiento del IGV sobre el precio total anunciado, las restricciones, las unidades mínimas y la fecha de fin en formato `AAAA-MM-DD`. Con la fecha pendiente, el CTA sigue visible. Una fecha confirmada activa el vencimiento al terminar ese día en Lima.

## Libro de Reclamaciones

Define `VITE_LIBRO_RECLAMACIONES_ENDPOINT` en el entorno de Vite antes de compilar. Déjala vacía para mostrar el formulario sin habilitar el envío.

- La SPA envía un `POST` JSON con los campos de la hoja y un `solicitudId`. Si el consumidor vuelve a enviar los mismos datos tras un error, se conserva ese identificador.
- El servidor valida y registra la hoja, asigna fecha de Lima, número correlativo y código, y envía una copia al campo `correo`. Debe reutilizar la misma constancia para un `solicitudId` ya registrado. Responde con un estado `2xx` y un JSON `{ "numero": "00001", "codigo": "LR-00001", "fecha": "2026-11-24" }` tras guardar la hoja y gestionar el correo. La SPA usa esa respuesta para mostrar la copia imprimible.
- Para un endpoint de otro origen, configura HTTPS y CORS para admitir solicitudes `POST` JSON desde el sitio. Mantén las credenciales de correo y almacenamiento en el servidor. Las variables `VITE_*` se incluyen en el bundle público.

## Consentimiento de analítica

Con `VITE_ANALYTICS_SCRIPT_URL` vacía, el sitio prescinde del aviso y de los scripts de analítica. Para habilitarla, proporciona la URL del script o de un cargador propio en esa variable y vuelve a compilar. `src/components/CookieConsent.tsx` carga el script solo después de una aceptación y guarda la preferencia en `localStorage`. El visitante puede rechazar o cambiar su elección. Al retirar el consentimiento, la página se recarga sin el script.

Antes de conectar un proveedor, incorpora a la política el alcance de su tratamiento, las cookies, su duración y los destinatarios. Añade al flujo de retirada la limpieza de las cookies del proveedor y su mecanismo de revocación, si corresponde.

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
