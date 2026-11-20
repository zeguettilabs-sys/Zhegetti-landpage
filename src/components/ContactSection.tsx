import { commonCopy } from '../data/services';
import { AdvisorPanel } from './AdvisorPanel';
import { useAdvisors } from './AdvisorDialog';

/** Boton de las fichas de servicio: abre el panel de asesores con ese servicio elegido. */
export function ContactActions({ serviceId }: { serviceId?: string }) {
  const { open } = useAdvisors();

  return (
    <div className="contact-panel__actions">
      <div className="contact-cta-row">
        <button type="button" className="crt-btn crt-btn--primary" onClick={() => open(serviceId)}>
          [ COTIZAR CON UN ASESOR ]
        </button>
      </div>
      <p className="contact-status-note">Elige un asesor y te llevamos a WhatsApp con tu mensaje listo.</p>
    </div>
  );
}

/** Pagina de contacto: el panel de asesores va directo en pantalla. */
export function ContactSection() {
  return (
    <section id="contacto" className="section-block" aria-labelledby="contacto-heading">
      <div className="contact-panel contact-panel--advisors">
        <AdvisorPanel
          intro={
            <div className="adv__intro">
              <p className="section-label">[ CONTACTAR CON ASESOR ]</p>
              <h2 id="contacto-heading" className="section-heading">
                {commonCopy.contactTitle}
              </h2>
              <p className="contact-panel__desc">{commonCopy.contactDescription}</p>
            </div>
          }
        />
      </div>
    </section>
  );
}
