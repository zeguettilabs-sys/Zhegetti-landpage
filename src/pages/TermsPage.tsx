import { Link } from 'react-router-dom';
import { CorreoLegal } from '../components/LegalFooter';
import { LegalPage } from '../components/LegalPage';
import { legal } from '../config/legal';
import { libroSeo, privacidadSeo, terminosSeo } from '../seo/metadata';

// BORRADOR para revisión de un abogado. Estos términos regulan el uso del sitio y las ofertas generales.
export function TermsPage() {
  return (
    <LegalPage heading="Términos de uso" seo={terminosSeo}>
      <section>
        <h2>Uso del sitio</h2>
        <p>
          {legal.razonSocial}, con RUC {legal.ruc} y domicilio en {legal.domicilio}, ofrece información sobre
          servicios de diseño web y canales para solicitar cotizaciones.
        </p>
        <p>
          Usa los canales de contacto de forma lícita y proporciona información que puedas compartir.
          Los enlaces a otros sitios abren servicios sujetos a sus propias condiciones.
        </p>
      </section>
      <section>
        <h2>Condiciones generales de las ofertas</h2>
        <p>
          El precio anunciado como «desde» corresponde al alcance inicial de la oferta. Consulta junto a la
          promoción sus prestaciones, vigencia, información tributaria y restricciones. El alcance que solicites
          determina si corresponden prestaciones adicionales y su precio.
        </p>
        <p>
          Pedir una cotización por WhatsApp o correo inicia una consulta. La contratación requiere una aceptación
          separada de la propuesta, con el alcance, precio total, plazos y forma de pago informados antes de aceptar.
        </p>
        <p>
          Una página optimizada para buscadores incorpora mejoras técnicas de SEO. Su visibilidad depende también
          de factores externos, incluidos los criterios de cada buscador.
        </p>
      </section>
      <section>
        <h2>Contenido y marcas</h2>
        <p>
          Los textos, marcas y materiales gráficos del sitio están protegidos según corresponda. Los materiales de
          terceros conservan sus respectivos titulares y están sujetos a los permisos aplicables.
        </p>
      </section>
      <section>
        <h2>Consultas y derechos del consumidor</h2>
        <p>
          Puedes escribir a <CorreoLegal />, consultar la <Link to={privacidadSeo.path}>Política de privacidad</Link> o
          presentar un reclamo o queja en el <Link to={libroSeo.path}>Libro de Reclamaciones</Link>. Se mantienen los
          derechos reconocidos por la legislación peruana de protección al consumidor.
        </p>
      </section>
    </LegalPage>
  );
}
