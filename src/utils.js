export const VERSION_CONSENTIMIENTO = 'v1-borrador';

// Mismos valores que las variables --optimo, --estable, --riesgo y --critico de tennismind.css
const COLORES_ESTADO = {
  'Óptimo': '#1b7048',
  'Estable': '#0b6f78',
  'En riesgo': '#9a5200',
  'Crítico': '#b3261e',
};
export const colorEstado = (estado) => COLORES_ESTADO[estado] || '#52626e';

export const fechaCorta = (iso) =>
  new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
