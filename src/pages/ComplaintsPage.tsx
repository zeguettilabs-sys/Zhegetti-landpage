import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LegalPage } from '../components/LegalPage';
import { legal } from '../config/legal';
import { libroSeo, privacidadSeo } from '../seo/metadata';

const endpoint = import.meta.env.VITE_LIBRO_RECLAMACIONES_ENDPOINT?.trim();

const receiptFields = [
  ['tipo', 'Tipo de solicitud'],
  ['nombre', 'Nombres y apellidos del consumidor'],
  ['documentoTipo', 'Tipo de documento'],
  ['documentoNumero', 'Número de documento'],
  ['domicilio', 'Domicilio del consumidor'],
  ['telefono', 'Teléfono del consumidor'],
  ['correo', 'Correo electrónico del consumidor'],
  ['menorDeEdad', 'El consumidor es menor de edad'],
  ['representanteNombre', 'Nombres y apellidos del representante'],
  ['representanteDomicilio', 'Domicilio del representante'],
  ['representanteTelefono', 'Teléfono del representante'],
  ['representanteCorreo', 'Correo electrónico del representante'],
  ['bienTipo', 'Tipo de bien'],
  ['bienDescripcion', 'Identificación del producto o servicio'],
  ['monto', 'Monto reclamado en soles'],
  ['detalle', 'Detalle del reclamo o queja'],
  ['pedido', 'Pedido del consumidor'],
  ['confirmacion', 'Confirmación del consumidor'],
] as const;

type Receipt = {
  numero: string;
  codigo: string;
  fecha: string;
};

function isReceipt(value: unknown): value is Receipt {
  if (!value || typeof value !== 'object') return false;
  const { numero, codigo, fecha } = value as Partial<Receipt>;
  return typeof numero === 'string' && numero.trim() !== ''
    && typeof codigo === 'string' && codigo.trim() !== ''
    && typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

// BORRADOR para revisión de un abogado. Hoja virtual basada en el Reglamento del Libro de Reclamaciones.
export function ComplaintsPage() {
  const [minor, setMinor] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ reference: Receipt; fields: Record<string, string> } | null>(null);
  const lastRequest = useRef<{ body: string; id: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!endpoint || sending) return;

    const fields = Object.fromEntries(
      Array.from(new FormData(event.currentTarget), ([name, value]) => [name, String(value).trim()])
    );
    const body = JSON.stringify(fields);

    setSending(true);
    setError('');
    try {
      // Reutiliza el identificador si el consumidor vuelve a enviar los mismos datos tras un fallo.
      if (lastRequest.current?.body !== body) {
        lastRequest.current = { body, id: crypto.randomUUID() };
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, solicitudId: lastRequest.current.id }),
      });
      if (!response.ok) throw new Error('Registro rechazado');
      const reference: unknown = await response.json();
      if (!isReceipt(reference)) throw new Error('Respuesta sin constancia de registro');
      setReceipt({ reference, fields });
    } catch {
      setError('No pudimos confirmar el registro de tu hoja. Revisa tus datos e inténtalo nuevamente.');
    } finally {
      setSending(false);
    }
  }

  return (
    <LegalPage heading="Libro de Reclamaciones" seo={libroSeo}>
      <dl className="legal-list">
        <div><dt>Proveedor</dt><dd>{legal.razonSocial}</dd></div>
        <div><dt>RUC</dt><dd>{legal.ruc}</dd></div>
        <div><dt>Domicilio</dt><dd>{legal.domicilio}</dd></div>
      </dl>
      <section>
        <h2>Hoja de Reclamación</h2>
        <p>Un reclamo expresa disconformidad con un producto o servicio. Una queja se refiere a la atención recibida u otro motivo ajeno al producto o servicio.</p>
        <p>El proveedor debe responder en un máximo de 15 días hábiles, sin prórroga. Presentar esta hoja permite también acudir al Indecopi cuando corresponda.</p>
        <p>Se enviará una copia de la hoja al correo del consumidor.</p>
        {!endpoint && <p role="status">Libro de Reclamaciones en implementación. El envío todavía no está disponible.</p>}
      </section>
      {receipt ? (
        <section className="complaint-receipt">
          <h2 role="status">Hoja de Reclamación registrada</h2>
          <dl className="legal-list">
            <div><dt>Número de hoja</dt><dd>{receipt.reference.numero}</dd></div>
            <div><dt>Código de identificación</dt><dd>{receipt.reference.codigo}</dd></div>
            <div><dt>Fecha de registro</dt><dd>{receipt.reference.fecha}</dd></div>
            <div><dt>Proveedor</dt><dd>{legal.razonSocial}</dd></div>
            <div><dt>RUC</dt><dd>{legal.ruc}</dd></div>
            <div><dt>Domicilio del proveedor</dt><dd>{legal.domicilio}</dd></div>
            {receiptFields.map(([name, label]) => receipt.fields[name] && (
              <div key={name}><dt>{label}</dt><dd>{receipt.fields[name]}</dd></div>
            ))}
            <div><dt>Acciones del proveedor</dt><dd>Pendiente de respuesta.</dd></div>
          </dl>
          <button type="button" className="crt-btn" onClick={() => window.print()}>Imprimir mi copia</button>
        </section>
      ) : (
        <form className="complaint-form" onSubmit={submit} aria-busy={sending}>
          <p>Los campos marcados como «opcional» pueden quedar en blanco.</p>

          <fieldset disabled={!endpoint || sending}>
            <legend>Datos del consumidor</legend>
            <label>Nombres y apellidos del consumidor
              <input name="nombre" autoComplete="section-consumidor name" required />
            </label>
            <label>Tipo de documento
              <select name="documentoTipo" required defaultValue="">
                <option value="" disabled>Selecciona una opción</option>
                <option>DNI</option>
                <option>Carné de extranjería</option>
                <option>Pasaporte</option>
                <option>Otro documento</option>
              </select>
            </label>
            <label>Número de documento
              <input name="documentoNumero" required />
            </label>
            <label>Domicilio del consumidor
              <input name="domicilio" autoComplete="section-consumidor street-address" required />
            </label>
            <label>Teléfono del consumidor
              <input name="telefono" type="tel" autoComplete="section-consumidor tel" required />
            </label>
            <label>Correo electrónico del consumidor
              <input name="correo" type="email" autoComplete="section-consumidor email" required />
            </label>
            <label className="complaint-form__checkbox">
              <input name="menorDeEdad" type="checkbox" value="Sí" checked={minor} onChange={(event) => setMinor(event.target.checked)} />
              El consumidor es menor de edad
            </label>
          </fieldset>

          {minor && (
            <fieldset disabled={sending}>
              <legend>Datos del padre, madre o representante</legend>
              <label>Nombres y apellidos del representante
                <input name="representanteNombre" autoComplete="section-representante name" required />
              </label>
              <label>Domicilio del representante
                <input name="representanteDomicilio" autoComplete="section-representante street-address" required />
              </label>
              <label>Teléfono del representante
                <input name="representanteTelefono" type="tel" autoComplete="section-representante tel" required />
              </label>
              <label>Correo electrónico del representante
                <input name="representanteCorreo" type="email" autoComplete="section-representante email" required />
              </label>
            </fieldset>
          )}

          <fieldset disabled={!endpoint || sending}>
            <legend>Identificación del bien o servicio</legend>
            <label>Tipo de bien
              <select name="bienTipo" required defaultValue="">
                <option value="" disabled>Selecciona una opción</option>
                <option>Producto</option>
                <option>Servicio</option>
              </select>
            </label>
            <label>Monto reclamado en soles (opcional)
              <input name="monto" type="number" min="0" step="0.01" inputMode="decimal" />
            </label>
            <label className="complaint-form__wide">Identificación del producto o servicio
              <input name="bienDescripcion" required />
            </label>
          </fieldset>

          <fieldset disabled={!endpoint || sending}>
            <legend>Motivo y pedido</legend>
            <label className="complaint-form__wide">Tipo de solicitud
              <select name="tipo" required defaultValue="">
                <option value="" disabled>Selecciona una opción</option>
                <option>Reclamo</option>
                <option>Queja</option>
              </select>
            </label>
            <label className="complaint-form__wide">Detalle del reclamo o queja
              <textarea name="detalle" rows={4} required />
            </label>
            <label className="complaint-form__wide">Pedido del consumidor
              <textarea name="pedido" rows={3} required />
            </label>
            <label className="complaint-form__checkbox complaint-form__wide">
              <input name="confirmacion" type="checkbox" value="Sí" required />
              Confirmo que los datos y el contenido de esta hoja corresponden a mi reclamo o queja.
            </label>
          </fieldset>

          <p>Consulta cómo trataremos tus datos en la <Link to={privacidadSeo.path}>Política de privacidad</Link>.</p>
          {error && <p role="alert">{error}</p>}
          <button type="submit" className="crt-btn" disabled={!endpoint || sending}>
            {sending ? 'Enviando…' : 'Enviar hoja de reclamación'}
          </button>
        </form>
      )}
    </LegalPage>
  );
}
