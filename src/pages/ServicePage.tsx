import { Navigate, useLocation, useParams } from 'react-router-dom';
import { CrtShell } from '../components/CrtShell';
import { Header } from '../components/Header';
import { ServiceDetail } from '../components/ServiceDetail';
import { activePromo, brandName, getServiceById, type ServiceItem } from '../data/services';
import { NotFoundPage } from './NotFoundPage';
import { serviceSeo } from '../seo/metadata';
import { SITE_URL, useSeo } from '../seo/useSeo';

export function ServicePage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { search, hash } = useLocation();
  const service = getServiceById(serviceId);
  if (service) return <ServiceContent service={service} />;

  if (serviceId === 'aplicaciones-web') {
    return <Navigate to={{ pathname: '/servicios/landing-pages', search, hash }} replace />;
  }

  return <NotFoundPage requestedSlug={serviceId} />;
}

function ServiceContent({ service }: { service: ServiceItem }) {
  const promo = activePromo(service);

  useSeo({
    ...serviceSeo(service),
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
  });

  return (
    <CrtShell variant="tv-home">
      <Header activeServiceId={service.id} />
      <ServiceDetail service={service} />
    </CrtShell>
  );
}
