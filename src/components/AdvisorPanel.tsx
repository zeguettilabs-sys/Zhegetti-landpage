import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { advisors, buildAdvisorMessage, mailtoHref, telHref, whatsappHref } from '../config/advisors';
import { siteConfig } from '../config/site';
import { activePromo, services } from '../data/services';

interface AdvisorPanelProps {
  /** Servicio que llega preseleccionado (por ejemplo, desde su ficha). */
  serviceId?: string;
  /** Va arriba de la columna izquierda (titulo y texto de la pagina o del dialogo). */
  intro?: ReactNode;
  /** Se llama al abrir WhatsApp (para cerrar el dialogo). */
  onSent?: () => void;
  /** Foco inicial en el primer servicio (cuando se abre como dialogo). */
  autoFocus?: boolean;
}

const NONE = '';

/**
 * Panel para cotizar o hablar con un asesor: se elige el servicio, se escribe un
 * mensaje corto y se pasa a WhatsApp con el texto ya armado, con cualquiera de los
 * tres asesores. Tambien se puede llamar o copiar el numero.
 */
export function AdvisorPanel({ serviceId, intro, onSent, autoFocus = false }: AdvisorPanelProps) {
  const [selected, setSelected] = useState<string>(serviceId ?? NONE);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const firstChip = useRef<HTMLButtonElement | null>(null);
  const copyTimer = useRef(0);
  const uid = useId();

  useEffect(() => {
    setSelected(serviceId ?? NONE);
  }, [serviceId]);

  useEffect(() => {
    if (autoFocus) firstChip.current?.focus();
  }, [autoFocus]);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const service = services.find((item) => item.id === selected);
  const message = useMemo(
    () => buildAdvisorMessage({ serviceName: service?.name, name, note, extra: service ? activePromo(service)?.message : undefined }),
    [service, name, note]
  );

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopied(id);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const options = [
    ...services.map((item) => ({ id: item.id, label: item.name.toUpperCase() })),
    { id: NONE, label: 'AÚN NO LO SÉ' },
  ];

  return (
    <div className="adv">
      <div className="adv__col adv__col--form">
        {intro}

        <fieldset className="adv__group">
          <legend className="adv__label">[ 1 · ¿QUÉ QUIERES COTIZAR? ]</legend>
          <div className="adv__chips" role="radiogroup" aria-label="Servicio a cotizar">
            {options.map((option, index) => (
              <button
                key={option.id || 'none'}
                ref={index === 0 ? firstChip : undefined}
                type="button"
                role="radio"
                aria-checked={selected === option.id}
                className={`adv__chip${selected === option.id ? ' is-on' : ''}`}
                onClick={() => setSelected(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="adv__group">
          <p className="adv__label">[ 2 · CUÉNTANOS (OPCIONAL) ]</p>
          <div className="adv__fields">
            <label className="adv__field" htmlFor={`${uid}-name`}>
              <span>TU NOMBRE</span>
              <input
                id={`${uid}-name`}
                type="text"
                value={name}
                maxLength={60}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. María"
              />
            </label>
            <label className="adv__field adv__field--note" htmlFor={`${uid}-note`}>
              <span>QUÉ NECESITAS</span>
              <textarea
                id={`${uid}-note`}
                value={note}
                maxLength={400}
                rows={2}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej. Quiero ordenar mis ventas y el inventario."
              />
            </label>
          </div>
        </div>

        <p className="adv__preview">
          <span className="adv__label">MENSAJE QUE SE ENVIARÁ</span>
          <span data-testid="advisor-preview">{message}</span>
        </p>
      </div>

      <div className="adv__col adv__col--advisors">
        <p className="adv__label">[ 3 · ELIGE UN ASESOR ]</p>
        <ul className="adv__list">
          {advisors.map((advisor) => (
            <li key={advisor.id} className="adv__advisor">
              <div className="adv__who">
                <span className="adv__name">{advisor.label}</span>
                <span className="adv__number">{advisor.display}</span>
              </div>
              <a
                className="crt-btn crt-btn--primary adv__go"
                href={whatsappHref(advisor, message)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Escribir por WhatsApp a ${advisor.label}, ${advisor.display}`}
                onClick={onSent}
              >
                [ WHATSAPP ]
              </a>
              <div className="adv__minor">
                <a href={telHref(advisor)} aria-label={`Llamar a ${advisor.label}`}>
                  [ LLAMAR ]
                </a>
                <button type="button" onClick={() => copy(advisor.id, advisor.display)}>
                  {copied === advisor.id ? '[ COPIADO ✓ ]' : '[ COPIAR ]'}
                </button>
              </div>
            </li>
          ))}
        </ul>
        {siteConfig.email && (
          <div className="adv__mail">
            <div className="adv__who">
              <span className="adv__name">CORREO EMPRESARIAL</span>
              <span className="adv__email">{siteConfig.email}</span>
            </div>
            <div className="adv__minor">
              <a href={mailtoHref(siteConfig.email, message, service?.name)} onClick={onSent}>
                [ ESCRIBIR ]
              </a>
              <button type="button" onClick={() => copy('correo', siteConfig.email ?? '')}>
                {copied === 'correo' ? '[ COPIADO ✓ ]' : '[ COPIAR ]'}
              </button>
            </div>
          </div>
        )}
        <p className="adv__note" role="status">
          Se abre WhatsApp con tu mensaje listo. También puedes llamar, copiar el número o escribir al correo.
        </p>
      </div>
    </div>
  );
}
