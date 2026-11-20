import { siteConfig } from '../config/site';
import { brandName, brandTagline } from '../data/services';

const PILLARS = [
  {
    code: '01 / OPERACIÓN CLARA',
    title: 'Orden en un solo lugar',
    description:
      'Reemplazamos hojas dispersas y reprocesos con herramientas diseñadas para la forma en que tu equipo trabaja.',
  },
  {
    code: '02 / HERRAMIENTAS A MEDIDA',
    title: 'Software pensado para crecer',
    description:
      'Construimos sistemas internos, portales y flujos preparados para adaptarse al ritmo real del negocio.',
  },
  {
    code: '03 / PROCESOS CONECTADOS',
    title: 'Menos fricción diaria',
    description:
      'Integramos tus plataformas existentes para que la información circule sin duplicidades ni cargas manuales.',
  },
];

export function AboutSection() {
  return (
    <section id="nosotros" className="section-block" aria-labelledby="nosotros-heading">
      <p className="section-label">[ NOSOTROS ]</p>
      <div className="about-grid">
        <div>
          <h2 id="nosotros-heading" className="section-heading">
            {brandName}: sistemas pensados para simplificar tu operación.
          </h2>
          <p className="about-lead">{brandTagline}</p>
          <p className="about-sub">
            Acompañamos a negocios y equipos desde {siteConfig.locationLabel} que necesitan ordenar
            su operación, desarrollar herramientas digitales propias o conectar los sistemas que ya
            utilizan en su día a día.
          </p>
        </div>

        <div className="about-pillars">
          {PILLARS.map((pillar) => (
            <article key={pillar.code} className="about-pillar">
              <span className="about-pillar__code">{pillar.code}</span>
              <h3 className="about-pillar__title">{pillar.title}</h3>
              <p className="about-pillar__desc">{pillar.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
