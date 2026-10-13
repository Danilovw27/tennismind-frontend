export const VERSION_CONSENTIMIENTO = 'v1-borrador';

const COLORES_ESTADO = {
  'Óptimo': '#28a745',
  'Estable': '#17a2b8',
  'En riesgo': '#ffc107',
  'Crítico': '#dc3545',
};
export const colorEstado = (estado) => COLORES_ESTADO[estado] || '#6c757d';

export const fechaCorta = (iso) =>
  new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
