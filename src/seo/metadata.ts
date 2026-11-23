import { brandName, brandTagline, type ServiceItem } from '../data/services';

export const INDEX_ROBOTS = 'index, follow, max-image-preview:large';
export const NOINDEX_ROBOTS = 'noindex, follow';

export const homeSeo = {
  path: '/',
  title: `Diseño web y landing pages en Perú | ${brandName}`,
  description: `${brandTagline} Creamos tu página web o landing page a medida, adaptada a celulares y con contacto por WhatsApp.`,
};

export const aboutSeo = {
  path: '/nosotros',
  title: `Nosotros | Diseño web en Perú | ${brandName}`,
  description: 'Conoce cómo Zeguetti diseña y desarrolla landing pages y páginas web a medida para negocios en Perú.',
};

export const contactSeo = {
  path: '/contacto',
  title: `Cotiza tu página web o landing page | ${brandName}`,
  description: 'Cotiza el diseño de tu página web o landing page con Zeguetti por WhatsApp o correo.',
};

export const showcaseSeo = {
  path: '/vitrina',
  title: `Vitrina — ${brandName}`,
  description: 'Vitrina de diseño web de Zeguetti.',
  noindex: true,
};

export const notFoundSeo = {
  title: `Página no encontrada — ${brandName}`,
  description: 'La dirección que buscas no existe. Vuelve al inicio para ver los servicios de Zeguetti.',
  noindex: true,
};

export function serviceSeo(service: ServiceItem) {
  return {
    path: service.path,
    title: service.id === 'landing-pages'
      ? `Diseño de landing pages para tu negocio | ${brandName}`
      : `${service.name} en Perú — ${brandName}`,
    description: service.description,
  };
}
