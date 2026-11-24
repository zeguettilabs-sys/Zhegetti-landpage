import { CorreoLegal } from '../components/LegalFooter';
import { LegalPage } from '../components/LegalPage';
import { legal } from '../config/legal';
import { privacidadSeo } from '../seo/metadata';

// BORRADOR para revisión de un abogado. Confirmar el inventario de tratamientos y transferencias.
export function PrivacyPage() {
  const { privacidad } = legal;

  return (
    <LegalPage heading="Política de privacidad" seo={privacidadSeo}>
      <section>
        <h2>Responsable del tratamiento</h2>
        <p>
          Esta política se rige por la Ley N.° 29733, Ley de Protección de Datos Personales, y su
          Reglamento, aprobado por el Decreto Supremo N.° 016-2024-JUS.
        </p>
        <dl className="legal-list">
          <div><dt>Titular del banco de datos</dt><dd>{legal.titularDatos}</dd></div>
          <div><dt>Razón social</dt><dd>{legal.razonSocial}</dd></div>
          <div><dt>Domicilio</dt><dd>{legal.domicilio}</dd></div>
          <div><dt>Banco de datos personales</dt><dd>{privacidad.bancoDatos}</dd></div>
          <div><dt>Correo para consultas de privacidad</dt><dd><CorreoLegal /></dd></div>
        </dl>
      </section>
      <section>
        <h2>Datos y finalidades</h2>
        <ul>
          <li>
            <strong>Consultas y cotizaciones.</strong> Usamos tu nombre, número de teléfono o correo, el servicio
            de interés y la información que nos envíes para responder a tu solicitud y preparar una cotización.
          </li>
          <li>
            <strong>Libro de Reclamaciones.</strong> Tratamos tus datos de identificación y contacto, los de tu
            representante si corresponde, y la información de tu hoja para registrarla, enviarte una copia y
            atenderla. El formulario indica qué campos se requieren para tramitarla.
          </li>
          <li>
            <strong>Seguridad y funcionamiento.</strong> El alojamiento puede procesar datos técnicos de la visita,
            como la dirección IP, la fecha y los registros de acceso, para servir y proteger el sitio.
          </li>
        </ul>
      </section>
      <section>
        <h2>Base del tratamiento y conservación</h2>
        <p>
          El tratamiento de datos que requiere tu consentimiento se realiza con tu autorización previa, libre,
          informada, expresa e inequívoca. Puedes retirarla por el canal indicado abajo. Si solicitas una
          cotización, podemos usar los datos necesarios para atender esa solicitud. El Libro de Reclamaciones
          se tramita para cumplir las obligaciones legales de atención al consumidor.
        </p>
        <p>
          Facilitar tus datos para una consulta es voluntario. Necesitamos un canal de contacto para responderte.
          Si omites datos obligatorios en el Libro, no podremos registrar la hoja.
        </p>
        <dl className="legal-list">
          <div><dt>Plazo para consultas y cotizaciones</dt><dd>{privacidad.plazoConsultas}</dd></div>
          <div><dt>Plazo para reclamos y quejas</dt><dd>{privacidad.plazoReclamaciones}</dd></div>
        </dl>
        <p>Los registros técnicos se conservan durante el tiempo necesario para operar y proteger el sitio.</p>
      </section>
      <section>
        <h2>WhatsApp, correo y proveedores</h2>
        <p>
          Al elegir WhatsApp, se abre un servicio de terceros que trata los datos que compartes conforme a su
          propia política. Si eliges correo electrónico, el mensaje se envía con tu proveedor de correo.
          Los enlaces a sitios de terceros se rigen por las políticas de esos sitios.
        </p>
        <dl className="legal-list">
          <div><dt>Proveedor de alojamiento</dt><dd>{privacidad.proveedorHosting}</dd></div>
          <div><dt>Proveedor de correo</dt><dd>{privacidad.proveedorCorreo}</dd></div>
          <div><dt>Destinatarios y transferencias, incluidas las internacionales</dt><dd>{privacidad.destinatariosYTransferencias}</dd></div>
        </dl>
      </section>
      <section>
        <h2>Derechos de acceso, rectificación, cancelación y oposición</h2>
        <p>
          Puedes ejercer tus derechos ARCO, solicitar información sobre el tratamiento o retirar tu consentimiento
          escribiendo a <CorreoLegal /> o presentando una solicitud en {legal.domicilio}. Indica tu nombre, el
          derecho que deseas ejercer, el pedido concreto y un medio de respuesta. Podemos solicitar que acredites
          tu identidad o la representación con la que actúas.
        </p>
        <p>
          Si consideras que tus derechos no fueron atendidos, puedes acudir a la Autoridad Nacional de Protección
          de Datos Personales.
        </p>
      </section>
      <section>
        <h2>Cookies y almacenamiento del navegador</h2>
        <p>
          El sitio guarda preferencias de interfaz en tu navegador y solo carga analítica si está habilitada y
          tú la aceptas en las preferencias de cookies.
        </p>
      </section>
    </LegalPage>
  );
}
