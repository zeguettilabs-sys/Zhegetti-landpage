export const PENDIENTE = '[PENDIENTE]';

export const legal = {
  razonSocial: PENDIENTE,
  ruc: PENDIENTE,
  domicilio: PENDIENTE,
  correoLegal: PENDIENTE,
  titularDatos: PENDIENTE,
  privacidad: {
    bancoDatos: PENDIENTE,
    plazoConsultas: PENDIENTE,
    plazoReclamaciones: PENDIENTE,
    plazoRegistrosTecnicos: PENDIENTE,
    proveedorHosting: PENDIENTE,
    proveedorCorreo: PENDIENTE,
    destinatariosYTransferencias: PENDIENTE,
  },
};

export const casoDLA = {
  // El titular autorizó la publicación del nombre, logo, capturas y enlace del caso DLA.
  autorizado: true,
};

const precioLanding = 100;

export const promoLanding = {
  precio: precioLanding,
  moneda: 'PEN',
  precioVisible: `S/ ${precioLanding}`,
  incluye: {
    diseno: 'Diseño y desarrollo de tu landing page',
    dominio: 'Dominio por 1 año',
    mantenimiento: 'Mantenimiento por 1 año',
    seo: 'SEO básico',
  },
  igv: PENDIENTE,
  // Al confirmarla, usar AAAA-MM-DD. La promoción vence al terminar ese día en Lima.
  vigencia: PENDIENTE,
  restricciones: PENDIENTE,
  unidadesMinimas: PENDIENTE,
};

export function textoBeneficiosLanding() {
  const { dominio, mantenimiento, seo } = promoLanding.incluye;
  return `${dominio.toLowerCase()}, ${mantenimiento.toLowerCase()} y ${seo}`;
}
