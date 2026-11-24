import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PENDIENTE, promoLanding } from '../src/config/legal';

const CAPTURES_DIR = path.resolve(process.cwd(), 'capturas');

function ensureCapturesDir() {
  fs.mkdirSync(CAPTURES_DIR, { recursive: true });
}

function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`console.error: ${msg.text()}`);
    }
  });
  return errors;
}

test.describe('SEO servido en HTML', () => {
  test.use({ javaScriptEnabled: false });

  test('La portada anuncia diseño web y sirve el favicon de Zeguetti', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Diseño web y landing pages en Perú | Zeguetti');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content', /El diseño web que tu negocio merecía\./
    );
    const favicon = page.locator('head link[rel="icon"]');
    await expect(favicon).toHaveAttribute('sizes', '192x192');
    const image = await page.request.get((await favicon.getAttribute('href'))!);
    expect(image.ok()).toBe(true);
    expect(image.headers()['content-type']).toContain('image/png');
  });

  test('La ficha tiene su propia URL canónica y descripción antes de ejecutar React', async ({ page }) => {
    await page.goto('/servicios/landing-pages');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', 'https://www.zeguetti.com/servicios/landing-pages'
    );
    await expect(page).toHaveTitle('Diseño de landing pages para tu negocio | Zeguetti');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', await page.title());
  });
});

test('La promoción vence a medianoche en Lima en las dos rutas', async ({ page }) => {
  const description = page.locator('meta[name="description"]');
  const openGraphDescription = page.locator('meta[property="og:description"]');
  const validity = /Válida hasta el 20 de diciembre de 2026/;
  const conditions = page.getByRole('note', { name: 'Condiciones de la promoción' });

  for (const route of ['/', '/servicios/landing-pages']) {
    await page.clock.setFixedTime(new Date('2026-12-21T04:59:59.999Z'));
    await page.goto(route);
    await expect(conditions).toContainText(validity);
    await expect(description).toHaveAttribute('content', validity);
    await expect(openGraphDescription).toHaveAttribute('content', validity);

    await page.clock.setFixedTime(new Date('2026-12-21T05:00:00.000Z'));
    await page.reload();
    await expect(page.locator('#root header')).toBeAttached();
    await expect(description).not.toHaveAttribute('content', /S\/ 100/);
    await expect(openGraphDescription).not.toHaveAttribute('content', validity);
    await expect(conditions).toHaveCount(0);
    await expect(page.locator('.promo-card')).toHaveCount(0);
  }
});

test('Una oferta abierta se retira al vencer sin recargar la ficha', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-12-21T04:59:00Z') });
  await page.clock.pauseAt(new Date('2026-12-21T04:59:10Z'));
  await page.goto('/servicios/landing-pages');
  await expect(page.locator('.promo-open')).toBeAttached();
  await page.clock.runFor(1_000);
  await page.locator('.promo-open').click();
  const dialog = page.getByRole('dialog');
  const poster = dialog.locator('.promo-card');
  await expect(poster.locator('.promo-card__date')).toHaveText('Válida hasta el 20 de diciembre de 2026');

  await page.clock.fastForward(49_000);
  await expect(page.locator('.promo-open')).toHaveCount(0);
  await expect(poster).toHaveCount(0);
  await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', /S\/ 100/);
  await expect(dialog.getByRole('link', { name: /Escribir por WhatsApp/ }).first())
    .not.toHaveAttribute('href', /S%2F%20100/);
});
test('La entrada antigua de Aplicaciones web abre la ficha vigente', async ({ page }) => {
  await page.goto('/servicios/aplicaciones-web?utm_source=google');
  await expect(page).toHaveURL(/\/servicios\/landing-pages\?utm_source=google$/);
});

test.describe('Zeguetti Web — Verificación completa', () => {
  test.beforeAll(() => {
    ensureCapturesDir();
  });

  test('Inicio con una sola cinta (Landing pages): sin giro, clic, teclado e historial (1440x960)', async ({ page }) => {
    // Recorre muchas paginas y la entrada del inicio se repite en cada regreso
    test.setTimeout(60_000);
    const errors = trackPageErrors(page);
    await page.setViewportSize({ width: 1440, height: 960 });
    const promoDate = promoLanding.vigencia === PENDIENTE ? '2026-12-20' : promoLanding.vigencia;
    await page.clock.setFixedTime(new Date(`${promoDate}T12:00:00-05:00`));
    await page.goto('/');

    // Verificar pantalla de carga CRT inicial con rallitas y luego transición al inicio
    const loader = page.locator('.crt-loader');
    await expect(loader).toBeVisible();
    await expect(loader.locator('img[src="/assets/logo-zeguetti-alpha.png"]')).toBeVisible();
    await expect(loader).toContainText('LOADING');
    await expect(page.locator('.crt-loader__tick').first()).toBeVisible();
    await page.screenshot({
      path: path.join(CAPTURES_DIR, 'escritorio-loader-1440x960.png'),
    });
    await expect(loader).toBeHidden({ timeout: 5000 });

    // Verificar secuencia escalonada de entrada (1: Encabezados -> 2: Pie -> 3: Tarjetas)
    await expect(page.locator('.crt-screen--home')).toHaveAttribute(
      'data-intro-step',
      '3',
      { timeout: 3000 }
    );
    await expect(
      page.locator('[data-slot-offset="0"] .carousel-slot__entry')
    ).toHaveCSS('opacity', '1');

    // Verificar ausencia de scroll horizontal Y vertical accidental y geometria parabolica en 1440x960
    const layoutMetrics = await page.evaluate(() => {
      const docOverflow =
        document.documentElement.scrollWidth > window.innerWidth;
      const docVerticalOverflow =
        document.documentElement.scrollHeight > window.innerHeight;
      const logo = document.querySelector<HTMLImageElement>('.header-brand__logo');
      const logoRect = logo?.getBoundingClientRect();
      const logoCenterOffset = logoRect
        ? Math.abs(logoRect.left + logoRect.width / 2 - window.innerWidth / 2)
        : 999;

      const centerSleeveActive = document
        .querySelector('[data-slot-offset="0"] .cover-sleeve')
        ?.getAttribute('data-active');
      const centerCassetteRect = document
        .querySelector('[data-slot-offset="0"] .cover-cassette')
        ?.getBoundingClientRect();
      const centerCardRect = document
        .querySelector('[data-slot-offset="0"] .cover-card')
        ?.getBoundingClientRect();
      const centerShadeOpacity = Number(
        getComputedStyle(
          document.querySelector('[data-slot-offset="0"] .cover-card__shade')!
        ).opacity
      );
      return {
        docOverflow,
        docVerticalOverflow,
        logoComplete: Boolean(logo?.complete && logo.naturalWidth > 0),
        logoCenterOffset,
        centerSleeveActive,
        cassetteSticksOut: Boolean(
          centerCassetteRect &&
            centerCardRect &&
            centerCassetteRect.top < centerCardRect.top - 10
        ),
        centerIlluminated: centerShadeOpacity === 0,
      };
    });

    expect(layoutMetrics.docOverflow).toBe(false);
    expect(layoutMetrics.docVerticalOverflow).toBe(false);
    expect(layoutMetrics.logoComplete).toBe(true);
    expect(layoutMetrics.logoCenterOffset).toBeLessThan(20);
    expect(layoutMetrics.centerSleeveActive).toBe('true');
    expect(layoutMetrics.cassetteSticksOut).toBe(true);
    expect(layoutMetrics.centerIlluminated).toBe(true);

    // Captura de escritorio inicio (1440x960)
    await page.screenshot({
      path: path.join(CAPTURES_DIR, 'escritorio-inicio-1440x960.png'),
    });

    // Con un solo servicio visible: una sola cinta, sin flechas ni giro
    await expect(page.locator('[data-slot-offset]')).toHaveCount(1);
    await expect(page.locator('.carousel-stage')).toHaveAttribute('data-single', 'true');
    await expect(page.locator('.carousel-caption__index')).toContainText('01 / 01 · LANDING PAGES');
    await expect(page.locator('.carousel-caption__cta')).toHaveAttribute('href', '/servicios/landing-pages');
    await expect(page.locator('.carousel-caption__cta')).toContainText('PROMO DESDE S/ 100');
    await expect(page.locator('.carousel-arrow').first()).toHaveCSS('visibility', 'hidden');
    await expect(page.getByText('[ ARRASTRA / EXPLORA ]')).toHaveCount(0);
    // Los servicios ocultos no se nombran en la pantalla
    await expect(page.locator('body')).not.toContainText('APLICACIONES WEB');
    await expect(page.locator('body')).not.toContainText('SISTEMAS A MEDIDA');

    const initialHistoryLength = await page.evaluate(() => window.history.length);

    // Teclado y arrastre (en el espacio vacio, no sobre la cinta) no cambian nada ni navegan
    await page.locator('#servicios').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    const stageBox = await page.locator('.carousel-stage').boundingBox();
    expect(stageBox).not.toBeNull();
    if (stageBox) {
      const cy = stageBox.y + stageBox.height / 2;
      await page.mouse.move(stageBox.x + 40, cy);
      await page.mouse.down();
      await page.mouse.move(stageBox.x + 200, cy, { steps: 10 });
      await page.mouse.up();
    }
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.carousel-caption__index')).toContainText('01 / 01 · LANDING PAGES');
    expect(await page.evaluate(() => window.history.length)).toBe(initialHistoryLength);

    // Clic en la cinta abre la ficha de Landing pages
    await page.locator('[data-slot-offset="0"] .carousel-card-link').click();
    await expect(page).toHaveURL(/\/servicios\/landing-pages$/);
    await expect(page.locator('h1')).toContainText(/Optimizada para\s*buscadores/);

    // Volver a servicios regresa a la cinta
    await page.getByRole('link', { name: '[ VOLVER A SERVICIOS ]' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.carousel-caption__index')).toContainText('01 / 01 · LANDING PAGES');

    // Navegación a Nosotros (objeto 3D VHS rotativo) y Contacto dentro del televisor CRT fijo
    await page.getByRole('link', { name: 'NOSOTROS', exact: true }).click();
    await expect(page).toHaveURL(/\/nosotros$/);
    await expect(page.locator('#nosotros')).toBeVisible();
    await expect(page.locator('.prof-sleeve .sleeve-cover')).toBeVisible();
    // La rueda corre el carrete de texto y hace girar la funda
    await page.mouse.move(720, 480);
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: /Saca la cinta/ }).click({ force: true });

    const nosotrosTvFit = await page.evaluate(() => {
      const footer = document.querySelector('.site-footer');
      const footerRect = footer?.getBoundingClientRect();
      return {
        horizontalOverflow:
          document.documentElement.scrollWidth > window.innerWidth,
        verticalOverflow:
          document.documentElement.scrollHeight > window.innerHeight,
        footerInsideViewport: footerRect
          ? footerRect.bottom <= window.innerHeight + 1
          : false,
      };
    });
    expect(nosotrosTvFit.horizontalOverflow).toBe(false);
    expect(nosotrosTvFit.verticalOverflow).toBe(false);
    expect(nosotrosTvFit.footerInsideViewport).toBe(true);

    await page.screenshot({
      path: path.join(CAPTURES_DIR, 'escritorio-nosotros-1440x960.png'),
    });

    await page.getByRole('link', { name: 'CONTACTO', exact: true }).click();
    await expect(page).toHaveURL(/\/contacto$/);
    await expect(page.locator('#contacto')).toContainText('ASESOR 01');
    await expect(page.locator('#contacto')).toContainText('+51 922 040 557');
    await expect(page.locator('#contacto')).toContainText('+51 907 136 664');
    await expect(page.locator('#contacto')).toContainText('+51 948 792 314');
    await expect(page.locator('#contacto')).toContainText('contacto@zeguetti.com');
    const contactTvFit = await page.evaluate(() => ({
      verticalOverflow: document.documentElement.scrollHeight > window.innerHeight,
    }));
    expect(contactTvFit.verticalOverflow).toBe(false);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('hola@zeguetti.com');

    // Verificar compatibilidad con /#nosotros y /#contacto
    await page.goto('/#nosotros');
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });
    await expect(page).toHaveURL(/\/nosotros$/);

    expect(errors).toEqual([]);
  });

  test('Ficha de Landing pages, recarga directa, servicios ocultos y ruta 404', async ({
    page,
  }) => {
    // Recorre la ficha completa, la galeria, los servicios retirados y la 404
    test.setTimeout(75_000);
    const errors = trackPageErrors(page);
    await page.setViewportSize({ width: 1440, height: 960 });

    // Carga directa y recarga en Landing pages
    await page.goto('/servicios/landing-pages');
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });
    await page.reload();
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });
    await expect(page.locator('h1')).toContainText(/Optimizada para\s*buscadores/);

    // Ficha con caso real: monitor con la web del cliente
    await expect(page.locator('.monitor-stage img')).toBeVisible();
    await expect(page.locator('.monitor-caption')).toContainText('CASO REAL');
    await expect(page.locator('a.monitor-caption')).toHaveAttribute('href', 'https://www.dalenabogada.com/');
    await expect(page.locator('.capability-card')).toHaveCount(3);
    await expect(page.locator('.process-grid article')).toHaveCount(4);

    // Sin otros servicios no hay "siguiente cinta"
    await expect(page.getByRole('link', { name: '[ SIGUIENTE SERVICIO ]' })).toHaveCount(0);

    // Captura de ficha en escritorio (1440x960) y comprobacion de TV sin scroll vertical + barra horizontal
    const initialDetailMetrics = await page.evaluate(() => ({
      verticalOverflow:
        document.documentElement.scrollHeight > window.innerHeight,
      progressValue: Number(
        document
          .querySelector('.detail-progress-bar')
          ?.getAttribute('aria-valuenow') ?? -1
      ),
    }));
    expect(initialDetailMetrics.verticalOverflow).toBe(false);
    expect(initialDetailMetrics.progressValue).toBe(0);

    await page.screenshot({
      path: path.join(CAPTURES_DIR, 'escritorio-ficha-landing-1440x960.png'),
    });

    // Scrollear horizontalmente con la rueda hacia la galeria curva y centrar pestaña 02/03 + verificar modal [AMPLIAR]
    const track = page.locator('.detail-track');
    await track.hover();
    await expect
      .poll(
        async () => {
          await page.mouse.wheel(0, 700);
          await page.waitForTimeout(200);
          return page.evaluate(() => {
            const rect = document.querySelector('.curved-gallery__tab')?.getBoundingClientRect();
            return Boolean(rect && rect.left >= 0 && rect.right <= window.innerWidth);
          });
        },
        { timeout: 20_000 }
      )
      .toBe(true);
    expect(
      Number(await page.locator('.detail-progress-bar').getAttribute('aria-valuenow'))
    ).toBeGreaterThan(15);

    const middleTab = page.getByRole('tab', { name: /02 \/ 03/ });
    await middleTab.click();
    await expect(middleTab).toHaveAttribute('aria-selected', 'true');
    await page.waitForTimeout(450);

    const galleryTabClipCheck = await page.evaluate(() => {
      const firstTab = document.querySelector('.curved-gallery__tab');
      const rect = firstTab?.getBoundingClientRect();
      return rect ? rect.left >= 0 && rect.right <= window.innerWidth : false;
    });
    expect(galleryTabClipCheck).toBe(true);

    await page.screenshot({
      path: path.join(CAPTURES_DIR, 'escritorio-ficha-scroll-1440x960.png'),
    });

    await page.getByRole('button', { name: '[ AMPLIAR ]' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    // Los servicios ocultos ("visible": false en data/servicios.json) no existen para el visitante
    for (const hidden of [
      '/servicios/sistemas-a-medida',
      '/servicios/automatizacion',
      '/servicios/integraciones-apis',
    ]) {
      await page.goto(hidden);
      await expect(page.locator('h1')).toContainText('No encontramos ese destino');
    }

    // Ruta inválida muestra recuperación útil
    await page.goto('/servicios/servicio-inexistente');
    await expect(page.locator('h1')).toContainText('No encontramos ese destino');
    await page.getByRole('link', { name: '[ VOLVER AL INICIO ]' }).click();
    await expect(page).toHaveURL(/\/$/);

    expect(errors).toEqual([]);
  });

  test('Adaptación visual y sin desbordes en 1366x768, 768x1024, 390x844 y 360x800', async ({
    page,
  }) => {
    // Recorre 7 tamaños con su pantalla de carga: necesita mas que el limite por defecto
    test.setTimeout(60_000);
    const errors = trackPageErrors(page);
    const viewports = [
      { width: 1920, height: 1080, name: 'escritorio-inicio-1920x1080', capture: true, checkTvFit: true },
      { width: 1440, height: 900, name: 'escritorio-inicio-1440x900', capture: true, checkTvFit: true },
      { width: 1280, height: 720, name: 'laptop-inicio-1280x720', capture: true, checkTvFit: true },
      { width: 1366, height: 768, name: 'laptop-1366x768', capture: false, checkTvFit: true },
      { width: 768, height: 1024, name: 'tablet-768x1024', capture: false, checkTvFit: true },
      { width: 390, height: 844, name: 'movil-inicio-390x844', capture: true, checkTvFit: false },
      { width: 360, height: 800, name: 'movil-inicio-360x800', capture: false, checkTvFit: false },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });
      await expect(page.locator('.crt-screen--home')).toHaveAttribute(
        'data-intro-step',
        '3',
        { timeout: 3000 }
      );
      await expect(
        page.locator('[data-slot-offset="0"] .carousel-slot__entry')
      ).toHaveCSS('opacity', '1');
      const metrics = await page.evaluate(() => ({
        horizontalOverflow:
          document.documentElement.scrollWidth > window.innerWidth,
        verticalOverflow:
          document.documentElement.scrollHeight > window.innerHeight,
      }));
      expect(metrics.horizontalOverflow, `Overflow horizontal en ${vp.name}`).toBe(false);
      if (vp.checkTvFit) {
        expect(metrics.verticalOverflow, `Overflow vertical en ${vp.name}`).toBe(false);
      }

      if (vp.capture) {
        await page.screenshot({
          path: path.join(CAPTURES_DIR, `${vp.name}.png`),
        });
      }
    }

    // Verificar /nosotros sin scroll vertical tambien en 1280x720
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/nosotros');
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });
    const nosotrosLaptopFit = await page.evaluate(() => ({
      horizontalOverflow:
        document.documentElement.scrollWidth > window.innerWidth,
      verticalOverflow:
        document.documentElement.scrollHeight > window.innerHeight,
    }));
    expect(nosotrosLaptopFit.horizontalOverflow).toBe(false);
    expect(nosotrosLaptopFit.verticalOverflow).toBe(false);

    // Probar menú móvil y ficha en móvil 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });
    const menuBtn = page.getByRole('button', {
      name: 'Abrir menú de navegación',
    });
    await expect(menuBtn).toBeVisible();
    const box = await menuBtn.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await menuBtn.click();
    await expect(page.locator('#mobile-nav-drawer')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav-drawer')).toBeHidden();

    // Ficha en móvil 390x844
    await page.goto('/servicios/landing-pages');
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });
    const detailOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(detailOverflow).toBe(false);
    await page.screenshot({
      path: path.join(CAPTURES_DIR, 'movil-ficha-390x844.png'),
    });

    expect(errors).toEqual([]);
  });

  test('Modo de movimiento reducido mantiene navegación y selección', async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('/');
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });

    await expect(page.locator('.carousel-caption__index')).toContainText(
      '01 / 01 · LANDING PAGES'
    );
    await page.locator('.carousel-caption__cta').click();
    await expect(page).toHaveURL(/\/servicios\/landing-pages$/);

    expect(errors).toEqual([]);
  });

  test('Vitrina: abre desde el menu, visor con teclado y vuelve al inicio en pantallas chicas', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('/');
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });

    await page.getByRole('link', { name: 'VITRINA', exact: true }).click();
    await expect(page).toHaveURL(/\/vitrina$/);
    await expect(page.locator('.nw')).toBeVisible();
    await expect(page.locator('.nw-ticker')).toContainText('[DEMO]');

    // Sin GPU (modo de prueba) las tarjetas salen en rejilla plana; con GPU, en el globo
    const flat = page.locator('.nw-flat button');
    await expect(page.locator('.nw-screen')).toHaveAttribute('data-status', /ready|off/, { timeout: 8000 });
    if (await flat.count()) {
      await flat.first().click();
      await expect(page.locator('.nw-lightbox')).toBeVisible();
      await expect(page.locator('.nw-lightbox__figure figcaption')).toContainText('ILUSTRATIVO');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Escape');
      await expect(page.locator('.nw-lightbox')).toHaveCount(0);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page).toHaveURL(/\/$/);
    expect(errors).toEqual([]);
  });

  test('Panel de asesores: se abre desde el pie, arma el mensaje de WhatsApp y se cierra', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('/');
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });

    await page.getByRole('button', { name: 'ESCRÍBENOS' }).click();
    const dialog = page.getByRole('dialog', { name: /CONTACTAR CON ASESOR/ });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('radio', { name: 'LANDING PAGES' }).click();
    await dialog.getByLabel('TU NOMBRE').fill('María');
    const links = dialog.locator('a.adv__go');
    await expect(links).toHaveCount(3);

    const expected = ['51922040557', '51907136664', '51948792314'];
    for (let i = 0; i < 3; i += 1) {
      const href = (await links.nth(i).getAttribute('href')) ?? '';
      expect(href.startsWith(`https://wa.me/${expected[i]}?text=`)).toBe(true);
      const text = decodeURIComponent(href.split('?text=')[1]);
      expect(text).toContain('Landing pages');
      expect(text).toContain('María');
    }
    await expect(dialog.locator('a[href^="tel:+51922040557"]')).toHaveCount(1);
    const mail = (await dialog.locator('a[href^="mailto:contacto@zeguetti.com"]').getAttribute('href')) ?? '';
    expect(decodeURIComponent(mail)).toContain('subject=Cotización: Landing pages');
    expect(decodeURIComponent(mail)).toContain('María');

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('Modo ahorro: se activa a mano, se recuerda y se activa solo en equipos de gama baja', async ({ page, browser }) => {
    const errors = trackPageErrors(page);
    await page.setViewportSize({ width: 1440, height: 960 });
    // Equipo potente simulado, para que no se active solo
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    });
    await page.goto('/');
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });

    const toggle = page.getByTestId('lite-toggle');
    await expect(toggle).toContainText('[OFF]');
    await toggle.click();
    await expect(toggle).toContainText('[ON]');
    await expect(page.locator('html')).toHaveClass(/lite/);
    await expect(page.locator('.carousel-stage')).toHaveAttribute('data-webgl', 'off');
    await expect(page.locator('.carousel-stage__webgl')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('zeguetti-lite'))).toBe('1');

    // El carrusel plano sigue funcionando
    await expect(page.locator('.carousel-caption__index')).toContainText('01 / 01 · LANDING PAGES');

    // Sin cambio de canal en modo ahorro
    await page.locator('.carousel-caption__cta').click();
    await expect(page).toHaveURL(/\/servicios\/landing-pages$/);
    await expect(page.locator('.crt-channel')).toHaveCount(0);

    // Se recuerda al recargar
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/lite/);

    // Equipo de gama baja sin preferencia guardada: arranca en modo ahorro
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 });
    });
    const low = await context.newPage();
    await low.goto('/');
    await expect(low.locator('html')).toHaveClass(/lite/);
    await expect(low.getByTestId('lite-toggle')).toContainText('[ON]');
    // ...pero si el visitante lo apaga, esa eleccion manda
    await low.getByTestId('lite-toggle').click();
    await expect(low.locator('html')).not.toHaveClass(/lite/);
    await low.reload();
    await expect(low.locator('html')).not.toHaveClass(/lite/);
    await context.close();

    expect(errors).toEqual([]);
  });
});
