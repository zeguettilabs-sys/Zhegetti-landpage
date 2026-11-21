import disenoJson from '../../data/diseno.json';
import serviciosJson from '../../data/servicios.json';

export type ServiceMockupType = 'dashboard' | 'portal' | 'workflow' | 'integrations' | 'landing';

/** Bloques del caso de estudio (como la pagina de proyecto de la referencia). */
export interface CaseImage {
  image: string;
  alt: string;
  width: number;
  height: number;
  /** Captura de celular (vertical). */
  phone?: boolean;
}

export type CaseBlock =
  | ({ type: 'shot' } & CaseImage)
  | { type: 'pair'; images: CaseImage[] }
  | { type: 'copy'; label: string; lead: string; body: string; low?: boolean };

export interface CaseStudy {
  client: string;
  person: string;
  year: string;
  sector: string[];
  services: string[];
  headline: string;
  summary: string;
  url: string;
  domain: string;
  /** Captura que va en el monitor de la portada de la ficha. */
  hero?: CaseImage;
  blocks: CaseBlock[];
}

/** Promocion vigente de un servicio (precio, que incluye y mensaje para el asesor). */
export interface ServicePromo {
  price: number;
  currency: string;
  priceLabel: string;
  /** Precio "desde" (puede costar mas segun el proyecto). */
  from?: boolean;
  /** Fecha fin (AAAA-MM-DD): despues de ese dia la promo deja de mostrarse sola. */
  validUntil?: string;
  validUntilLabel?: string;
  tag: string;
  headline: string;
  includes: string[];
  cta: string;
  message: string;
}

/** Clientes cuyo logo se muestra en el cuadro de clientes. */
export interface ClientLogo {
  id: string;
  name: string;
  person: string;
  logo: string;
  url: string;
  service: string;
}

/** Proyecto publicado que sirve de ejemplo del servicio. */
export interface ServiceExample {
  label: string;
  url: string;
  domain: string;
  description: string;
}

export interface ServiceFeature {
  title: string;
  description: string;
}

export interface ServiceItem {
  id: string;
  order: number;
  name: string;
  path: string;
  category: string;
  title: string;
  titleLines: string[];
  description: string;
  descriptionDisplayLines: string[];
  caption: string;
  tags: string[];
  features: ServiceFeature[];
  mockup: ServiceMockupType;
  mockupLabel: string;
  nextService: string;
  example?: ServiceExample;
  caseStudy?: CaseStudy;
  promo?: ServicePromo;
}

export interface ProcessStep {
  title: string;
  description: string;
}

export interface CommonCopy {
  capabilitiesLabel: string;
  capabilitiesTitle: string;
  processLabel: string;
  processTitle: string;
  process: ProcessStep[];
  contactTitle: string;
  contactDescription: string;
}

export interface SiteConfigData {
  email: string | null;
  whatsappUrl: string | null;
  domain: string | null;
  contactEndpoint: string | null;
  edition: string;
  locationLabel: string;
  foundationYearConfirmed: boolean;
}

export interface ServicesPayload {
  brand: string;
  tagline: string;
  services: ServiceItem[];
  common: CommonCopy;
  siteConfig: SiteConfigData;
}

export interface DesignConfig {
  colors: Record<string, string>;
  fonts: {
    interface: string;
    editorial: string;
    body: string;
  };
  designReference: {
    width: number;
    height: number;
    detailContentHeight: number;
  };
  proposedImplementation: {
    perspectivePx: number;
    carouselTransitionMs: number[];
    pageTransitionMs: number[];
    dragStartPx: number;
    dragCommitPx: number;
    autoAdvance: boolean;
    clickAnyCardOpensItsService: boolean;
    breakpointsPx: {
      tablet: number;
      desktop: number;
    };
  };
}

const payload = serviciosJson as ServicesPayload;

export const brandName = payload.brand;
export const brandTagline = payload.tagline;
export const services: ServiceItem[] = payload.services;
export const commonCopy: CommonCopy = payload.common;
/** La promo se muestra solo mientras este vigente (hora de Lima). */
export function activePromo(service: ServiceItem): ServicePromo | undefined {
  const promo = service.promo;
  if (!promo) return undefined;
  if (!promo.validUntil) return promo;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
  return today <= promo.validUntil ? promo : undefined;
}

export const clients: ClientLogo[] = (payload as { clients?: ClientLogo[] }).clients ?? [];
export const rawSiteConfig: SiteConfigData = payload.siteConfig;
export const designConfig: DesignConfig = disenoJson as DesignConfig;

export function wrapIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

export function getServiceById(serviceId?: string): ServiceItem | undefined {
  if (!serviceId) return undefined;
  return services.find((item) => item.id === serviceId);
}

export function getServiceIndexById(serviceId?: string | null): number {
  if (!serviceId) return -1;
  return services.findIndex((item) => item.id === serviceId);
}

export function formatOrderFraction(order: number, total = services.length): string {
  const paddedOrder = String(order).padStart(2, '0');
  const paddedTotal = String(total).padStart(2, '0');
  return `${paddedOrder} / ${paddedTotal}`;
}
