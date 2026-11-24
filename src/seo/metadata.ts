import { activePromo, brandName, brandTagline, getServiceById, type ServiceItem } from '../data/services';
import { textoBeneficiosLanding } from '../config/legal';

export const INDEX_ROBOTS = 'index, follow, max-image-preview:large';
export const NOINDEX_ROBOTS = 'noindex, follow';

function landingPromoDescription(service?: ServiceItem) {
  const promo = service?.id === 'landing-pages' ? activePromo(service) : undefined;
  if (!promo) return undefined;
  const pricePrefix = promo.from ? 'desde' : 'por';
  return `${pricePrefix} ${promo.priceLabel} con ${textoBeneficiosLanding()}`;
}

export function homeSeo() {
  const promo = landingPromoDescription(getServiceById('landing-pages'));
  return {
    path: '/',
    title: `Diseño web y landing pages en Perú | ${brandName}`,
    description: promo
      ? `${brandTagline} Landing pages en Perú ${promo}.`
      : `${brandTagline} Creamos tu página web o landing page a medida, adaptada a celulares y con contacto por WhatsApp.`,
  };
}

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

export const terminosSeo = {
  path: '/terminos',
  title: `Términos de uso | ${brandName}`,
  description: 'Consulta los términos de uso de Zeguetti y las condiciones generales de sus ofertas de diseño web.',
};

export const privacidadSeo = {
  path: '/privacidad',
  title: `Política de privacidad | ${brandName}`,
  description: 'Conoce cómo Zeguetti trata tus datos personales y cómo puedes ejercer tus derechos de privacidad en Perú.',
};

export const libroSeo = {
  path: '/libro-de-reclamaciones',
  title: `Libro de Reclamaciones | ${brandName}`,
  description: 'Accede al Libro de Reclamaciones virtual de Zeguetti para presentar un reclamo o una queja.',
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
  const promo = landingPromoDescription(service);
  return {
    path: service.path,
    title: service.id === 'landing-pages'
      ? `Diseño de landing pages para tu negocio | ${brandName}`
      : `${service.name} en Perú — ${brandName}`,
    description: promo
      ? `Diseñamos tu landing page ${promo}. Presenta tu negocio y recibe consultas por WhatsApp.`
      : service.description,
  };
}
