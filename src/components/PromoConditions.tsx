import { promoLanding, textoBeneficiosLanding } from '../config/legal';

export function PromoConditions({ id }: { id: string }) {
  const { igv, vigencia, restricciones, unidadesMinimas } = promoLanding;

  return (
    <div id={id} className="promo-conditions" role="note" aria-label="Condiciones de la promoción">
      Incluye {textoBeneficiosLanding()}.{' '}
      IGV: {igv}. Vigencia: {vigencia}.{' '}
      Restricciones: {restricciones}. Unidades mínimas: {unidadesMinimas}.
    </div>
  );
}
