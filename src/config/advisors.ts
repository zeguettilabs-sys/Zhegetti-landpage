/**
 * Asesores de Zeguetti: los tres numeros de WhatsApp a los que se pide una cotizacion.
 * `e164` va sin "+" ni espacios, como lo pide wa.me.
 * Para cambiar un numero o sumar otro basta editar esta lista.
 */
export interface Advisor {
  id: string;
  label: string;
  /** Numero internacional sin "+" (Peru = 51). */
  e164: string;
  /** Como se muestra en pantalla. */
  display: string;
}

export const advisors: Advisor[] = [
  { id: 'asesor-1', label: 'ASESOR 01', e164: '51922040557', display: '+51 922 040 557' },
  { id: 'asesor-2', label: 'ASESOR 02', e164: '51907136664', display: '+51 907 136 664' },
  { id: 'asesor-3', label: 'ASESOR 03', e164: '51948792314', display: '+51 948 792 314' },
];

export interface QuoteDraft {
  /** Nombre del servicio elegido; vacio = aun no lo sabe. */
  serviceName?: string;
  name?: string;
  note?: string;
}

/** Mensaje que llega ya escrito a WhatsApp. */
export function buildAdvisorMessage({ serviceName, name, note }: QuoteDraft): string {
  const intro = serviceName
    ? `Hola, quiero cotizar "${serviceName}" con Zeguetti.`
    : 'Hola, quiero una asesoría de Zeguetti para cotizar un proyecto.';
  const parts = [intro];
  if (name?.trim()) parts.push(`Mi nombre es ${name.trim()}.`);
  if (note?.trim()) parts.push(note.trim());
  return parts.join(' ');
}

export function whatsappHref(advisor: Advisor, message: string): string {
  return `https://wa.me/${advisor.e164}?text=${encodeURIComponent(message)}`;
}

export function telHref(advisor: Advisor): string {
  return `tel:+${advisor.e164}`;
}

/** Correo con asunto y cuerpo ya escritos (el mismo mensaje que va a WhatsApp). */
export function mailtoHref(email: string, message: string, serviceName?: string): string {
  const subject = serviceName ? `Cotización: ${serviceName}` : 'Consulta a Zeguetti';
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
