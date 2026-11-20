import { rawSiteConfig, type SiteConfigData } from '../data/services';

/**
 * Configuracion central del sitio y canales de contacto.
 * Los valores iniciales provienen de data/servicios.json ("siteConfig") y
 * permanecen en null hasta que el dueño confirme correo, WhatsApp o dominio.
 */
export const siteConfig: SiteConfigData = {
  ...rawSiteConfig,
};

export function hasConfirmedContact(config: SiteConfigData = siteConfig): boolean {
  return Boolean(
    config.email?.trim() ||
      config.whatsappUrl?.trim() ||
      config.contactEndpoint?.trim()
  );
}

export function formatEmailHref(email: string): string {
  return `mailto:${email.trim()}`;
}
