// Iconos en SVG propio (sin dependencias). El estado se distingue por forma, nombre y color.
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false' };

export const IconoPulso = () => (<svg {...base}><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>);
export const IconoSet = () => (<svg {...base}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></svg>);
export const IconoHistorial = () => (<svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const IconoObservacion = () => (<svg {...base}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9zM9 12h6M9 16h4" /></svg>);

export const LogoTennisMind = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <circle cx="16" cy="16" r="14" fill="#d9e021" />
    <path d="M5 8c6 3 6 13 0 16M27 8c-6 3-6 13 0 16" fill="none" stroke="#17324d" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ESTADOS = {
  'Óptimo': { clase: 'estado-optimo', icono: <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></svg> },
  'Estable': { clase: 'estado-estable', icono: <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M8 10h8M8 14h8" /></svg> },
  'En riesgo': { clase: 'estado-en-riesgo', icono: <svg {...base}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.01" /></svg> },
  'Crítico': { clase: 'estado-critico', icono: <svg {...base}><path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z" /><path d="M12 7v6M12 16v.01" /></svg> },
};

export function EtiquetaEstado({ estado, grande = false }) {
  const e = ESTADOS[estado];
  if (!e) return <span>{estado}</span>;
  return <span className={`estado ${e.clase}${grande ? ' estado-grande' : ''}`}>{e.icono}{estado}</span>;
}
