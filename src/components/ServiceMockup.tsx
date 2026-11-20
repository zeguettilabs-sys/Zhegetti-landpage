import type { ServiceItem } from '../data/services';

interface ServiceMockupProps {
  service: ServiceItem;
}

const CHROME_TITLES: Record<ServiceItem['mockup'], string> = {
  dashboard: 'zeguetti / gestión empresarial',
  portal: 'zeguetti / portal de clientes',
  workflow: 'zeguetti / automatización de procesos',
  integrations: 'zeguetti / integraciones y APIs',
  landing: 'tumarca.com / landing page',
};

const DASHBOARD_BARS = [
  { h: 28, active: false },
  { h: 42, active: false },
  { h: 34, active: false },
  { h: 52, active: false },
  { h: 39, active: false },
  { h: 63, active: false },
  { h: 50, active: false },
  { h: 72, active: false },
  { h: 60, active: true },
  { h: 82, active: true },
  { h: 74, active: true },
  { h: 88, active: true },
];

function DashboardMockup() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '120px minmax(0, 1fr)',
        minHeight: 'clamp(340px, 46svh, 420px)',
      }}
      className="mockup-dashboard-grid"
    >
      <aside
        className="mockup-dashboard-sidebar"
        style={{
          backgroundColor: '#1b1b1b',
          color: '#e4dfd9',
          padding: '22px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-interface)',
            fontSize: 15,
            letterSpacing: '0.06em',
            paddingLeft: 6,
          }}
        >
          Z / WORKSPACE
        </div>
        <div className="mockup-dashboard-sidebar__links" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['Resumen', 'Ventas', 'Inventario', 'Clientes', 'Reportes'].map((item, idx) => (
            <div
              key={item}
              style={{
                padding: '8px 10px',
                borderRadius: 4,
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: idx === 0 ? 600 : 400,
                backgroundColor: idx === 0 ? '#cb343b' : 'transparent',
                color: idx === 0 ? '#fcf8ef' : '#aaa49c',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </aside>

      <div style={{ padding: '20px 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 'clamp(17px, 1.5vw, 22px)',
              color: '#1d1c1a',
              lineHeight: 1.2,
            }}
          >
            Toda tu operación, conectada.
          </div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: '#6f6860',
              marginTop: 4,
            }}
          >
            Una vista clara para tomar decisiones.
          </div>
        </div>

        <div
          className="mockup-dashboard-kpis"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          {[
            { label: 'VENTAS', value: '128' },
            { label: 'INVENTARIO', value: 'Actualizado' },
            { label: 'EQUIPO', value: 'Conectado' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                borderRadius: 6,
                border: '1px solid #c9c2b8',
                backgroundColor: '#f4f0e9',
                padding: '10px 11px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-interface)',
                  fontSize: 13,
                  color: '#777067',
                }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#27241f',
                  marginTop: 6,
                  wordBreak: 'break-word',
                }}
              >
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderRadius: 6,
            border: '1px solid #ccc5ba',
            backgroundColor: '#f4f0e9',
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-interface)',
              fontSize: 14,
              color: '#5f574e',
              marginBottom: 10,
            }}
          >
            ACTIVIDAD DE TU NEGOCIO
          </div>
          <div
            aria-hidden="true"
            style={{
              height: 92,
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              alignItems: 'end',
              gap: 6,
            }}
          >
            {DASHBOARD_BARS.map((bar, index) => (
              <span
                key={index}
                style={{
                  height: `${bar.h}%`,
                  borderRadius: 2,
                  backgroundColor: bar.active ? '#cb343b' : '#b5aea3',
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 14,
              color: '#302c27',
              marginBottom: 6,
            }}
          >
            Pedidos recientes
          </div>
          <div style={{ borderTop: '1px solid #c9c1b7' }}>
            {[
              { name: 'Pedido registrado', status: 'En proceso' },
              { name: 'Stock actualizado', status: 'Listo' },
              { name: 'Reporte de ventas', status: 'Disponible' },
            ].map((row) => (
              <div
                key={row.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 4px',
                  borderBottom: '1px solid #c9c1b7',
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                }}
              >
                <span style={{ color: '#514a42' }}>{row.name}</span>
                <span style={{ color: '#7c302f', fontWeight: 600 }}>{row.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PortalMockup() {
  return (
    <div style={{ padding: '20px 24px 24px', minHeight: 'clamp(340px, 46svh, 420px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 12,
          borderBottom: '1px solid #c6beb3',
        }}
      >
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#26211c' }}>
          TU EMPRESA
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#6f675f' }}>Mi cuenta</span>
      </div>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 'clamp(20px, 1.8vw, 26px)',
            lineHeight: 1.15,
            color: '#26211c',
          }}
        >
          Todo lo que necesitas,
          <br />
          en un solo lugar.
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#7a7167', marginTop: 8 }}>
          Gestiona tus solicitudes desde cualquier dispositivo.
        </div>
      </div>

      <div className="mockup-portal-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        {[
          { title: 'Mis pedidos', sub: 'Consulta estados y entregas' },
          { title: 'Documentos', sub: 'Tus archivos, organizados' },
          { title: 'Soporte', sub: 'Habla con nuestro equipo' },
        ].map((card) => (
          <div
            key={card.title}
            style={{
              borderRadius: 8,
              border: '1px solid #c8c0b4',
              backgroundColor: '#f5f0e8',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: '#cb343b',
              }}
            />
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#26211c' }}>
              {card.title}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#7a7167', lineHeight: 1.35 }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 'auto',
          borderRadius: 8,
          backgroundColor: '#252322',
          color: '#e4dfd9',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17 }}>
          Tu próxima solicitud empieza aquí.
        </div>
        <span
          style={{
            display: 'inline-block',
            padding: '6px 18px',
            borderRadius: 99,
            backgroundColor: '#cb343b',
            color: '#ffffff',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Nueva solicitud
        </span>
      </div>
    </div>
  );
}

function WorkflowMockup() {
  const steps = [
    { num: '01', title: 'Solicitud recibida', sub: 'Formulario / correo' },
    { num: '02', title: 'Validar información', sub: 'Reglas de tu negocio' },
    { num: '03', title: 'Actualizar sistema', sub: 'Datos conectados' },
    { num: '04', title: 'Notificar al equipo', sub: 'Acción completada' },
  ];

  return (
    <div style={{ padding: '20px 24px 24px', minHeight: 'clamp(340px, 46svh, 420px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 'clamp(19px, 1.6vw, 24px)',
            color: '#29231e',
          }}
        >
          De una solicitud a un resultado.
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#776e64', marginTop: 4 }}>
          Un flujo claro, sin repetir el mismo trabajo.
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: 420, width: '100%', margin: '4px auto 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((step, idx) => (
          <div key={step.num} style={{ position: 'relative' }}>
            <div
              style={{
                borderRadius: 9,
                border: '1px solid #bfb5a9',
                backgroundColor: '#f7f2ea',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 34,
                  borderRadius: 7,
                  backgroundColor: '#cb343b',
                  color: '#ffffff',
                  fontFamily: 'var(--font-interface)',
                  fontSize: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {step.num}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#352d25' }}>
                  {step.title}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#827569' }}>{step.sub}</div>
              </div>
              <span
                aria-hidden="true"
                style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#7e776f' }}
              />
            </div>
            {idx < steps.length - 1 && (
              <div
                aria-hidden="true"
                style={{
                  width: 2,
                  height: 12,
                  margin: '0 auto',
                  backgroundColor: '#91867b',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationsMockup() {
  const nodes = [
    { label: 'TIENDA', sub: 'Pedidos', col: 1, row: 1 },
    { label: 'CRM', sub: 'Clientes', col: 3, row: 1 },
    { label: 'PAGOS', sub: 'Transacciones', col: 1, row: 3 },
    { label: 'SISTEMA', sub: 'Operación', col: 3, row: 3 },
  ];

  return (
    <div style={{ padding: '20px 24px 20px', minHeight: 'clamp(340px, 46svh, 420px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 'clamp(19px, 1.6vw, 24px)',
            color: '#2e2721',
          }}
        >
          Tus herramientas se entienden.
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#7b7066', marginTop: 4 }}>
          La información fluye entre los sistemas que ya utilizas.
        </div>
      </div>

      <div
        className="mockup-integrations-grid"
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 270,
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr 1fr',
          gridTemplateRows: 'auto auto auto',
          alignItems: 'center',
          justifyItems: 'center',
          gap: 12,
          padding: '10px 6px',
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 400 240"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <line x1="72" y1="45" x2="200" y2="120" stroke="#a59586" strokeWidth="2" />
          <line x1="328" y1="45" x2="200" y2="120" stroke="#a59586" strokeWidth="2" />
          <line x1="72" y1="195" x2="200" y2="120" stroke="#a59586" strokeWidth="2" />
          <line x1="328" y1="195" x2="200" y2="120" stroke="#a59586" strokeWidth="2" />
        </svg>

        {nodes.map((node) => (
          <div
            key={node.label}
            style={{
              gridColumn: node.col,
              gridRow: node.row,
              position: 'relative',
              zIndex: 2,
              width: '100%',
              maxWidth: 132,
              borderRadius: 8,
              border: '1px solid #b9ab9c',
              backgroundColor: '#f4eee5',
              padding: '12px 10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: 'var(--font-interface)', fontSize: 20, color: '#403329' }}>
              {node.label}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#8a7868' }}>{node.sub}</div>
          </div>
        ))}

        <div
          style={{
            gridColumn: 2,
            gridRow: 2,
            position: 'relative',
            zIndex: 3,
            borderRadius: 14,
            backgroundColor: '#cb343b',
            color: '#ffffff',
            padding: '18px 20px',
            textAlign: 'center',
            minWidth: 138,
            boxShadow: '0 10px 24px rgba(203, 52, 59, 0.28)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-interface)', fontSize: 22, letterSpacing: '0.06em' }}>
            ZEGUETTI
          </div>
          <div style={{ fontFamily: 'var(--font-interface)', fontSize: 13, color: '#f4d8d9', marginTop: 2 }}>
            CONECTA / SINCRONIZA
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 12, color: '#817264' }}>
        Una conexión adaptada a tu operación.
      </div>
    </div>
  );
}

function LandingMockup() {
  const ink = '#26211c';
  const mute = '#7a7167';
  return (
    <div
      className="mockup-landing"
      style={{
        position: 'relative',
        padding: '18px 24px 24px',
        minHeight: 'clamp(340px, 46svh, 420px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          paddingBottom: 12,
          borderBottom: '1px solid #c6beb3',
        }}
      >
        <span style={{ fontFamily: 'var(--font-editorial)', fontWeight: 700, fontSize: 17, color: ink }}>Tu Marca</span>
        <span className="mockup-landing__nav" style={{ display: 'flex', gap: 14, fontFamily: 'var(--font-body)', fontSize: 12, color: mute }}>
          <span>Servicios</span>
          <span>Experiencia</span>
          <span>Contacto</span>
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            color: '#fcf8ef',
            background: '#2f9c98',
            borderRadius: 999,
            padding: '6px 12px',
            whiteSpace: 'nowrap',
          }}
        >
          Consulta gratis
        </span>
      </div>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-editorial)',
            fontWeight: 700,
            fontSize: 'clamp(22px, 2vw, 30px)',
            lineHeight: 1.1,
            color: ink,
          }}
        >
          Tu servicio, explicado
          <br />
          en una sola página.
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: mute, marginTop: 8, maxWidth: 360 }}>
          Quién eres, qué ofreces y por qué confiar en ti. Con un botón para escribirte al instante.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#fcf8ef', background: '#2f9c98', borderRadius: 999, padding: '8px 14px' }}>
            Agendar consulta →
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: ink, border: '1px solid #b9b0a4', borderRadius: 999, padding: '8px 14px' }}>
            Ver servicios
          </span>
        </div>
      </div>

      <div className="mockup-portal-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        {[
          { num: '01', title: 'Servicio principal', sub: 'Lo que más te piden' },
          { num: '02', title: 'Experiencia', sub: 'Casos y resultados' },
          { num: '03', title: 'Contacto', sub: 'WhatsApp y formulario' },
        ].map((card) => (
          <div
            key={card.num}
            style={{
              borderRadius: 8,
              border: '1px solid #c8c0b4',
              backgroundColor: '#f5f0e8',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span style={{ fontFamily: 'var(--font-interface)', fontSize: 16, color: '#2f9c98' }}>{card.num}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: ink }}>{card.title}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: mute }}>{card.sub}</span>
          </div>
        ))}
      </div>

      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 18,
          bottom: 18,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#25d366',
          boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
        }}
      />
    </div>
  );
}

export function ServiceMockup({ service }: ServiceMockupProps) {
  return (
    <div className="detail-hero__visual">
      <div className="mockup-perspective-wrap">
        <div
          className="mockup-surface"
          aria-label={`${service.mockupLabel}: ${service.name}`}
        >
          <div className="mockup-chrome">
            <span className="mockup-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="mockup-chrome__title">{CHROME_TITLES[service.mockup]}</span>
          </div>

          {service.mockup === 'dashboard' && <DashboardMockup />}
          {service.mockup === 'portal' && <PortalMockup />}
          {service.mockup === 'workflow' && <WorkflowMockup />}
          {service.mockup === 'integrations' && <IntegrationsMockup />}
          {service.mockup === 'landing' && <LandingMockup />}
        </div>
      </div>

      <span className="mockup-caption">
        {service.mockupLabel.toUpperCase()} / {service.name.toUpperCase()} · DATOS DE DEMOSTRACIÓN
      </span>
    </div>
  );
}
