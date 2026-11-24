import { Link } from 'react-router-dom';
import { legal, PENDIENTE } from '../config/legal';
import { formatEmailHref, siteConfig } from '../config/site';
import { libroSeo, privacidadSeo, terminosSeo } from '../seo/metadata';

export function CorreoLegal() {
  return legal.correoLegal === PENDIENTE
    ? legal.correoLegal
    : <a href={formatEmailHref(legal.correoLegal)}>{legal.correoLegal}</a>;
}

export function LegalFooter() {
  return (
    <footer className="legal-footer">
      <div className="legal-footer__identity">
        <span>© {siteConfig.edition} {legal.razonSocial}</span>
        <span>RUC: {legal.ruc}</span>
        <span>Domicilio: {legal.domicilio}</span>
        <span>Correo legal: <CorreoLegal /></span>
      </div>
      <nav aria-label="Información legal">
        <Link to={terminosSeo.path}>Términos de uso</Link>
        <Link to={privacidadSeo.path}>Política de privacidad</Link>
        <Link to={libroSeo.path}>Libro de Reclamaciones</Link>
      </nav>
    </footer>
  );
}
