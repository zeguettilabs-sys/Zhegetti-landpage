import { useParams } from 'react-router-dom';
import { CrtShell } from '../components/CrtShell';
import { Header } from '../components/Header';
import { ServiceDetail } from '../components/ServiceDetail';
import { activePromo, brandName, getServiceById } from '../data/services';
import { NotFoundPage } from './NotFoundPage';
import { SITE_URL, useSeo } from '../seo/useSeo';

export function ServicePage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const service = getServiceById(serviceId);
  const promo = service ? activePromo(service) : undefined;

  useSeo(
    service
      ? {
          title: promo
            ? `Landing page desde ${promo.priceLabel} con dominio y mantenimiento — ${brandName}`
            : `${service.name} en Perú — ${brandName}`,
          description: promo
            ? `${promo.headline}: ${promo.includes.join(', ').toLowerCase()}. ${service.description}`
            : service.description,
          path: service.path,
          jsonLd: {
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Service',
                name: service.name,
                serviceType: service.category,
                description: service.description,
                url: `${SITE_URL}${service.path}`,
                areaServed: { '@type': 'Country', name: 'Perú' },
                provider: { '@type': 'Organization', name: brandName, url: `${SITE_URL}/` },
                ...(promo
                  ? {
                      offers: {
                        '@type': 'Offer',
                        price: String(promo.price),
                        priceCurrency: promo.currency,
                        ...(promo.validUntil ? { priceValidUntil: promo.validUntil } : {}),
                        description: promo.includes.join(' · '),
                        url: `${SITE_URL}${service.path}`,
                        availability: 'https://schema.org/InStock',
                      },
                    }
                  : {}),
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
                  { '@type': 'ListItem', position: 2, name: service.name, item: `${SITE_URL}${service.path}` },
                ],
              },
            ],
          },
        }
      : {
          title: `Página no encontrada — ${brandName}`,
          description: 'La dirección que buscas no existe. Vuelve al inicio para ver los servicios de Zeguetti.',
          path: `/servicios/${serviceId ?? ''}`,
          noindex: true,
        }
  );

  if (!service) {
    return <NotFoundPage requestedSlug={serviceId} />;
  }

  return (
    <CrtShell variant="tv-home">
      <Header activeServiceId={service.id} />
      <ServiceDetail service={service} />
    </CrtShell>
  );
}
