import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { privacidadSeo } from '../seo/metadata';

const analyticsScriptUrl = import.meta.env.VITE_ANALYTICS_SCRIPT_URL?.trim();
const storageKey = 'zeguetti-analytics-consent';
type Preference = 'accepted' | 'rejected';

function readPreference(): Preference | null {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved === 'accepted' || saved === 'rejected' ? saved : null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  return analyticsScriptUrl ? <AnalyticsPreference scriptUrl={analyticsScriptUrl} /> : null;
}

// BORRADOR para revisión de un abogado antes de habilitar un proveedor de analítica.
function AnalyticsPreference({ scriptUrl }: { scriptUrl: string }) {
  const [preference, setPreference] = useState(readPreference);
  const [editing, setEditing] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    if (preference !== 'accepted') return;
    const script = document.createElement('script');
    script.async = true;
    script.src = scriptUrl;
    document.head.append(script);
    return () => script.remove();
  }, [preference, scriptUrl]);

  function choose(next: Preference) {
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      setStorageError(true);
      return;
    }
    setStorageError(false);
    setPreference(next);
    setEditing(false);

    // Quitar el elemento script no detiene un proveedor que ya se ejecutó.
    if (preference === 'accepted' && next === 'rejected') window.location.reload();
  }

  if (preference && !editing) {
    return (
      <button type="button" className="crt-btn cookie-settings" onClick={() => setEditing(true)}>
        Preferencias de cookies
      </button>
    );
  }

  return (
    <section className="cookie-notice" aria-labelledby="cookie-notice-heading">
      <h2 id="cookie-notice-heading">Preferencias de cookies</h2>
      <p>
        Con tu permiso usamos analítica para conocer cómo se utiliza el sitio. Puedes cambiar tu
        elección en cualquier momento. Consulta la <Link to={privacidadSeo.path}>Política de privacidad</Link>.
      </p>
      {storageError && <p role="alert">El navegador no permitió guardar tu preferencia.</p>}
      <div className="cookie-notice__actions">
        <button type="button" className="crt-btn" onClick={() => choose('rejected')}>Rechazar analítica</button>
        <button type="button" className="crt-btn" onClick={() => choose('accepted')}>Aceptar analítica</button>
      </div>
    </section>
  );
}
