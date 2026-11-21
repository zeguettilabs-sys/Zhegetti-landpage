import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

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

test.describe('Zeguetti Web — Verificación completa', () => {
  test.beforeAll(() => {
    ensureCapturesDir();
  });

  test('Inicio, carrusel 3D, clic lateral, arrastre, teclado e historial (1440x960)', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('/');

    // Verificar pantalla de carga CRT inicial con rallitas y luego transición al inicio
    const loader = page.locator('.crt-loader');
    await expect(loader).toBeVisible();
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

      const card0 = document
        .querySelector('[data-slot-offset="0"]')
        ?.getBoundingClientRect();
      const card1 = document
        .querySelector('[data-slot-offset="1"]')
        ?.getBoundingClientRect();
      const card2 = document
        .querySelector('[data-slot-offset="2"]')
        ?.getBoundingClientRect();
      const parabolicArc =
        card0 && card1 && card2
          ? card0.top + card0.height / 2 < card1.top + card1.height / 2 &&
            card1.top + card1.height / 2 < card2.top + card2.height / 2
          : false;

      const centerSleeveActive = document
        .querySelector('[data-slot-offset="0"] .cover-sleeve')
        ?.getAttribute('data-active');
      const sideSleeveActive = document
        .querySelector('[data-slot-offset="1"] .cover-sleeve')
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
      const sideShadeOpacity = Number(
        getComputedStyle(
          document.querySelector('[data-slot-offset="1"] .cover-card__shade')!
        ).opacity
      );

      return {
        docOverflow,
        docVerticalOverflow,
        logoComplete: Boolean(logo?.complete && logo.naturalWidth > 0),
        logoCenterOffset,
        parabolicArc,
        centerSleeveActive,
        sideSleeveActive,
        cassetteSticksOut: Boolean(
          centerCassetteRect &&
            centerCardRect &&
            centerCassetteRect.top < centerCardRect.top - 10
        ),
        centerIlluminated: centerShadeOpacity === 0 && sideShadeOpacity > 0.2,
      };
    });

    expect(layoutMetrics.docOverflow).toBe(false);
    expect(layoutMetrics.docVerticalOverflow).toBe(false);
    expect(layoutMetrics.logoComplete).toBe(true);
    expect(layoutMetrics.logoCenterOffset).toBeLessThan(20);
    expect(layoutMetrics.parabolicArc).toBe(true);
    expect(layoutMetrics.centerSleeveActive).toBe('true');
    expect(layoutMetrics.sideSleeveActive).toBe('false');
    expect(layoutMetrics.cassetteSticksOut).toBe(true);
    expect(layoutMetrics.centerIlluminated).toBe(true);

    // Captura de escritorio inicio (1440x960)
    await page.screenshot({
      path: path.join(CAPTURES_DIR, 'escritorio-inicio-1440x960.png'),
    });

    // Estado inicial sincronizado
    await expect(page.locator('.carousel-caption__index')).toContainText(
      '01 / 05 · SISTEMAS A MEDIDA'
    );
    await expect(page.locator('.carousel-caption__cta')).toHaveAttribute(
      'href',
      '/servicios/sistemas-a-medida'
    );

    const initialHistoryLength = await page.evaluate(() => window.history.length);

    // Flecha siguiente -> 02 Aplicaciones web (circular y sin contaminar historial)
    await page.getByRole('button', { name: 'Siguiente servicio' }).click();
    await expect(page.locator('.carousel-caption__index')).toContainText(
      '02 / 05 · APLICACIONES WEB'
    );
    await expect(page.locator('.carousel-caption__cta')).toHaveAttribute(
      'href',
      '/servicios/aplicaciones-web'
    );

    // Teclado ArrowRight -> 03 Automatización y ArrowLeft -> 02 Aplicaciones web
    const carouselRegion = page.locator('#servicios');
    await carouselRegion.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.carousel-caption__index')).toContainText(
      '03 / 05 · AUTOMATIZACIÓN'
    );
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.carousel-caption__index')).toContainText(
      '02 / 05 · APLICACIONES WEB'
    );

    // Flecha anterior dos veces para probar vuelta circular 02 -> 01 -> 05
    await page.getByRole('button', { name: 'Servicio anterior' }).click();
    await expect(page.locator('.carousel-caption__index')).toContainText(
      '01 / 05 · SISTEMAS A MEDIDA'
    );
    await page.getByRole('button', { name: 'Servicio anterior' }).click();
    await expect(page.locator('.carousel-caption__index')).toContainText(
      '05 / 05 · LANDING PAGES'
    );

    const historyAfterSlides = await page.evaluate(() => window.history.length);
    expect(historyAfterSlides).toBe(initialHistoryLength);

    // Volver a 01
    await page.getByRole('button', { name: 'Siguiente servicio' }).click();
    await expect(page.locator('.carousel-caption__index')).toContainText(
      '01 / 05 · SISTEMAS A MEDIDA'
    );

    // Arrastrar horizontalmente >= 48px debe cambiar de tarjeta SIN navegar a ninguna ficha
    const stageBox = await page.locator('.carousel-stage').boundingBox();
    expect(stageBox).not.toBeNull();
    if (stageBox) {
      const cy = stageBox.y + stageBox.height / 2;
      const cx = stageBox.x + stageBox.width / 2;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx - 140, cy, { steps: 10 });
      await page.mouse.up();
    }
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.carousel-caption__index')).toContainText(
      '02 / 05 · APLICACIONES WEB'
    );

    // Clic directo en una tarjeta LATERAL visible (slot +1: 03 Automatizacion) abre su ficha sin centrarla antes
    const lateralAutomatizacion = page
      .locator('[data-carousel-visible="true"][data-slot-offset="1"] .carousel-card-link[href="/servicios/automatizacion"]');
    await lateralAutomatizacion.click();
    await expect(page).toHaveURL(/\/servicios\/automatizacion$/);
    await expect(page.locator('h1')).toContainText('Menos tareas.');

    // Volver a servicios restaura esa tarjeta activa (03)
    await page.getByRole('link', { name: '[ VOLVER A SERVICIOS ]' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.carousel-caption__index')).toContainText(
      '03 / 05 · AUTOMATIZACIÓN'
    );

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

  test('Las 5 fichas de servicio, recarga directa, Siguiente servicio, Atrás y ruta 404', async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await page.setViewportSize({ width: 1440, height: 960 });

    const expectedOrder = [
      {
        path: '/servicios/sistemas-a-medida',
        title: 'Tu operación,',
        mockupText: 'Toda tu operación, conectada.',
      },
      {
        path: '/servicios/aplicaciones-web',
        title: 'Tu negocio,',
        mockupText: 'Todo lo que necesitas,',
      },
      {
        path: '/servicios/automatizacion',
        title: 'Menos tareas.',
        mockupText: 'De una solicitud a un resultado.',
      },
      {
        path: '/servicios/integraciones-apis',
        title: 'Tus herramientas,',
        mockupText: 'Tus herramientas se entienden.',
      },
      {
        path: '/servicios/landing-pages',
        title: 'Tu negocio,',
        mockupText: 'Tu servicio, explicado',
      },
    ];

    // Carga directa y recarga en Aplicaciones web
    await page.goto('/servicios/aplicaciones-web');
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });
    await page.reload();
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });
    await expect(page.locator('h1')).toContainText('Tu negocio,');
    await expect(page.locator('.mockup-surface')).toContainText(
      'Todo lo que necesitas,'
    );

    // Captura de ficha en escritorio (1440x960) y comprobacion de TV sin scroll vertical + barra horizontal
    await page.goto('/servicios/sistemas-a-medida');
    await expect(page.locator('.crt-loader')).toBeHidden({ timeout: 5000 });
    await expect(page.locator('h1')).toContainText('Tu operación,');
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
      path: path.join(CAPTURES_DIR, 'escritorio-ficha-sistemas-1440x960.png'),
    });

    // Scrollear horizontalmente con la rueda hacia la galeria curva y centrar pestaña 02/03 + verificar modal [AMPLIAR]
    const track = page.locator('.detail-track');
    await track.hover();
    await page.mouse.wheel(0, 1250);
    await expect
      .poll(async () =>
        Number(
          await page
            .locator('.detail-progress-bar')
            .getAttribute('aria-valuenow')
        )
      )
      .toBeGreaterThan(15);

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

    // Verificar recorrido completo Siguiente servicio: 01 -> 02 -> 03 -> 04 -> 05 -> 01
    for (let i = 0; i < expectedOrder.length; i += 1) {
      const current = expectedOrder[i];
      await expect(page).toHaveURL(new RegExp(`${current.path}$`));
      await expect(page.locator('h1')).toContainText(current.title);
      await expect(page.locator('.mockup-surface')).toContainText(
        current.mockupText
      );
      await expect(page.locator('.mockup-caption')).toContainText(
        'VISTA ILUSTRATIVA'
      );
      await expect(page.locator('.capability-card')).toHaveCount(3);
      await expect(page.locator('.process-grid article')).toHaveCount(4);

      const nextLink = page.getByRole('link', { name: '[ SIGUIENTE SERVICIO ]' });
      await nextLink.scrollIntoViewIfNeeded();
      await nextLink.click();
    }

    await expect(page).toHaveURL(/\/servicios\/sistemas-a-medida$/);

    // Botón Atrás del navegador funciona
    await page.goBack();
    await expect(page).toHaveURL(/\/servicios\/landing-pages$/);
    // La ficha de landing pages muestra el ejemplo publicado
    await expect(page.locator('a.detail-example')).toHaveAttribute('href', 'https://www.dalenabogada.com/');

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
    await page.goto('/servicios/sistemas-a-medida');
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

    await page.getByRole('button', { name: 'Siguiente servicio' }).click();
    await expect(page.locator('.carousel-caption__index')).toContainText(
      '02 / 05 · APLICACIONES WEB'
    );
    await page.getByRole('link', { name: '[ VER SOLUCIÓN ]' }).click();
    await expect(page).toHaveURL(/\/servicios\/aplicaciones-web$/);

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

    await dialog.getByRole('radio', { name: 'AUTOMATIZACIÓN' }).click();
    await dialog.getByLabel('TU NOMBRE').fill('María');
    const links = dialog.locator('a.adv__go');
    await expect(links).toHaveCount(3);

    const expected = ['51922040557', '51907136664', '51948792314'];
    for (let i = 0; i < 3; i += 1) {
      const href = (await links.nth(i).getAttribute('href')) ?? '';
      expect(href.startsWith(`https://wa.me/${expected[i]}?text=`)).toBe(true);
      const text = decodeURIComponent(href.split('?text=')[1]);
      expect(text).toContain('Automatización');
      expect(text).toContain('María');
    }
    await expect(dialog.locator('a[href^="tel:+51922040557"]')).toHaveCount(1);
    const mail = (await dialog.locator('a[href^="mailto:contacto@zeguetti.com"]').getAttribute('href')) ?? '';
    expect(decodeURIComponent(mail)).toContain('subject=Cotización: Automatización');
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
    await page.getByRole('button', { name: 'Siguiente servicio' }).click();
    await expect(page.locator('.carousel-caption__index')).toContainText('02 / 05 · APLICACIONES WEB');

    // Sin cambio de canal en modo ahorro
    await page.getByRole('link', { name: '[ VER SOLUCIÓN ]' }).click();
    await expect(page).toHaveURL(/\/servicios\/aplicaciones-web$/);
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
