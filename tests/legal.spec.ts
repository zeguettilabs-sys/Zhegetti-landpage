import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });

const complaintsEndpoint = process.env.VITE_LIBRO_RECLAMACIONES_ENDPOINT;
const analyticsScript = process.env.VITE_ANALYTICS_SCRIPT_URL;

test('El pie legal permite navegar a las tres páginas desde el inicio', async ({ page }) => {
  await page.goto('/');
  const legal = page.getByRole('navigation', { name: 'Información legal' });
  await expect(legal.getByRole('link', { name: 'Términos de uso' })).toHaveAttribute('href', '/terminos');
  await expect(legal.getByRole('link', { name: 'Política de privacidad' })).toHaveAttribute('href', '/privacidad');
  const libro = legal.getByRole('link', { name: 'Libro de Reclamaciones' });
  await expect(libro).toHaveAttribute('href', '/libro-de-reclamaciones');
  await libro.focus();
  await expect(libro).toBeFocused();
  await libro.press('Enter');
  await expect(page.getByRole('heading', { name: 'Libro de Reclamaciones', level: 1 })).toBeVisible();
  await expect(page).toHaveTitle('Libro de Reclamaciones | Zeguetti');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('Los enlaces legales quedan dentro del marco CRT de las páginas en escritorio', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-12-20T12:00:00-05:00'));
  for (const path of ['/servicios/landing-pages', '/contacto']) {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto(path);
    const libro = page.getByRole('navigation', { name: 'Información legal' }).getByRole('link', { name: 'Libro de Reclamaciones' });
    await expect(libro).toBeVisible();
    const clipped = await libro.evaluate((link) =>
      link.getBoundingClientRect().bottom > link.closest('.crt-screen')!.getBoundingClientRect().bottom
    );
    expect(clipped, path).toBe(false);
    if (path === '/servicios/landing-pages') {
      const conditions = page.getByRole('note', { name: 'Condiciones de la promoción' });
      await expect(conditions.getByText('Precio final base S/ 100 con IGV incluido.')).toBeInViewport({ ratio: 0.99 });
      await expect(conditions.getByText('Válida hasta el 20 de diciembre de 2026.')).toBeInViewport({ ratio: 0.99 });
      await conditions.scrollIntoViewIfNeeded();
      await expect(conditions).toBeInViewport({ ratio: 0.99 });
    }
    await libro.click({ timeout: 5000 });
    await expect(page).toHaveURL(/\/libro-de-reclamaciones$/);
  }
});

test('El Libro conserva el formulario y avisa cuando el envío está deshabilitado', async ({ page }) => {
  test.skip(Boolean(complaintsEndpoint), 'Esta prueba usa el build sin endpoint.');
  await page.goto('/libro-de-reclamaciones');
  await expect(page.getByRole('status')).toContainText('en implementación');
  await expect(page.getByLabel('Correo electrónico del consumidor')).toBeVisible();
  await expect(page.getByLabel('Monto reclamado en soles')).toBeVisible();
  await expect(page.getByLabel('Pedido del consumidor')).toBeVisible();
  await expect(page.getByLabel('El consumidor es menor de edad')).toBeVisible();
  await expect(page.getByText('Se enviará una copia de la hoja al correo del consumidor.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar hoja de reclamación' })).toBeDisabled();
});

if (complaintsEndpoint) {
  test('El Libro reintenta el mismo registro y permite imprimir una vez confirmado', async ({ page }) => {
    const requests: Array<Record<string, string>> = [];
    await page.route(complaintsEndpoint, async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill(requests.length === 1
        ? { status: 503 }
        : { json: { numero: '00001', codigo: 'LR-00001', fecha: '2026-11-24' } });
    });

    await page.goto('/libro-de-reclamaciones');
    if (analyticsScript) await page.getByRole('button', { name: 'Rechazar analítica' }).click();
    await page.getByLabel('Nombres y apellidos del consumidor').fill('Persona de prueba');
    await page.getByLabel('Tipo de documento').selectOption('DNI');
    await page.getByLabel('Número de documento').fill('00000000');
    await page.getByLabel('Domicilio del consumidor').fill('Dirección de prueba');
    await page.getByLabel('Teléfono del consumidor').fill('900000000');
    await page.getByLabel('Correo electrónico del consumidor').fill('prueba@example.com');
    await page.getByLabel('El consumidor es menor de edad').check();
    await page.getByLabel('Nombres y apellidos del representante').fill('Representante de prueba');
    await page.getByLabel('Domicilio del representante').fill('Dirección de prueba');
    await page.getByLabel('Teléfono del representante').fill('900000000');
    await page.getByLabel('Correo electrónico del representante').fill('representante@example.com');
    await page.getByLabel('Tipo de bien').selectOption('Servicio');
    await page.getByLabel('Identificación del producto o servicio').fill('Landing page');
    await page.getByLabel('Monto reclamado en soles').fill('100.00');
    await page.getByLabel('Tipo de solicitud').selectOption('Reclamo');
    await page.getByLabel('Detalle del reclamo o queja').fill('Descripción de prueba');
    await page.getByLabel('Pedido del consumidor').fill('Pedido de prueba');
    await page.getByLabel(/Confirmo que los datos/).check();

    const submit = page.getByRole('button', { name: 'Enviar hoja de reclamación' });
    await submit.click();
    await expect(page.getByRole('alert')).toContainText('No pudimos confirmar');
    await submit.click();

    await expect(page.getByRole('heading', { name: 'Hoja de Reclamación registrada' })).toBeVisible();
    await expect(page.getByText('LR-00001')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Imprimir mi copia' })).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({
      correo: 'prueba@example.com',
      representanteNombre: 'Representante de prueba',
      monto: '100.00',
      tipo: 'Reclamo',
      detalle: 'Descripción de prueba',
      pedido: 'Pedido de prueba',
      confirmacion: 'Sí',
      solicitudId: expect.stringMatching(/^[\da-f-]{36}$/),
    });
    expect(requests[1]).toEqual(requests[0]);
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByRole('heading', { name: 'Hoja de Reclamación registrada' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Información legal' })).toBeHidden();
  });
}

test('Las condiciones acompañan ambas llamadas a la acción de la promoción', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-12-20T12:00:00-05:00'));
  for (const path of ['/', '/servicios/landing-pages']) {
    await page.goto(path);
    const conditions = page.getByRole('note', { name: 'Condiciones de la promoción' }).first();
    await expect(conditions).toBeVisible();
    await expect(conditions).toContainText(/dominio.*mantenimiento por 1 año.*SEO básico/i);
    await expect(conditions).toContainText('Precio final base S/ 100 con IGV incluido.');
    await expect(conditions).toContainText('Válida hasta el 20 de diciembre de 2026');
    await expect(conditions).toContainText('Restricciones: [PENDIENTE]');
  }
});

test('Sin scripts de analítica no se muestra el aviso ni se guardan cookies', async ({ page, context }) => {
  test.skip(Boolean(analyticsScript), 'Esta prueba usa el build sin analítica.');
  await page.goto('/privacidad');
  await expect(page.getByRole('heading', { name: 'Política de privacidad', level: 1 })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Preferencias de cookies' })).toHaveCount(0);
  expect(await context.cookies()).toEqual([]);
});

if (analyticsScript) {
  test('La analítica requiere aceptación y se detiene al retirar el consentimiento', async ({ page }) => {
    let loads = 0;
    await page.route(analyticsScript, async (route) => {
      loads += 1;
      await route.fulfill({ contentType: 'application/javascript', body: 'window.analyticsTest = true;' });
    });

    await page.goto('/privacidad');
    const notice = page.getByRole('region', { name: 'Preferencias de cookies' });
    const open = page.getByRole('button', { name: 'Preferencias de cookies' });
    await expect(notice).toBeVisible();
    await notice.getByRole('button', { name: 'Rechazar analítica' }).click();
    await expect(open).toBeVisible();
    expect(loads).toBe(0);

    await open.click();
    await notice.getByRole('button', { name: 'Aceptar analítica' }).click();
    await expect.poll(() => loads).toBe(1);
    await open.click();
    await notice.getByRole('button', { name: 'Rechazar analítica' }).click();
    await expect(open).toBeVisible();
    await expect(page.locator(`script[src="${analyticsScript}"]`)).toHaveCount(0);
    expect(loads).toBe(1);
  });
}
