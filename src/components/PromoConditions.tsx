import { promoLanding, textoBeneficiosLanding } from '../config/legal';
import type { ServicePromo } from '../data/services';

export function PromoConditions({ id, promo }: { id: string; promo: ServicePromo }) {
  const { igv, restricciones, unidadesMinimas } = promoLanding;
  const tax = igv === 'Incluido' ? 'con IGV incluido' : `(IGV: ${igv})`;

  return (
    <div id={id} className="promo-conditions" role="note" aria-label="Condiciones de la promoción">
      <span>Precio final base {promo.priceLabel} {tax}.</span>{' '}
      {promo.validUntilLabel && <><span>{promo.validUntilLabel}.</span>{' '}</>}
      Incluye {textoBeneficiosLanding()}.{' '}
      Restricciones: {restricciones}. Unidades mínimas: {unidadesMinimas}.
    </div>
  );
}
