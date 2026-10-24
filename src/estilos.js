// Estilos compartidos. Los colores salen de las variables de tennismind.css.
export const caja = { background: 'var(--fondo)', padding: '16px', borderRadius: 'var(--radio)', border: '1px solid var(--borde)' };
export const tarjeta = { background: 'var(--superficie)', padding: '16px', borderRadius: 'var(--radio)', border: '1px solid var(--borde)', boxShadow: 'var(--sombra)' };
export const etiqueta = { fontSize: '12px', color: 'var(--texto-2)', fontWeight: 600 };
export const entrada = { width: '100%', padding: '8px' };

export const boton = (color = 'var(--marca)', deshabilitado = false) => ({
  width: '100%', minHeight: '44px', padding: '10px 14px', background: color, color: 'white', border: 'none',
  borderRadius: '8px', fontWeight: 700,
  cursor: deshabilitado ? 'not-allowed' : 'pointer', opacity: deshabilitado ? 0.5 : 1,
});

export const botonSecundario = (deshabilitado = false) => ({
  minHeight: '44px', padding: '8px 14px', background: 'var(--superficie)', color: 'var(--marca)', border: '1px solid var(--marca)',
  borderRadius: '8px', fontWeight: 600, cursor: deshabilitado ? 'not-allowed' : 'pointer',
  opacity: deshabilitado ? 0.5 : 1,
});

const mensaje = (color, fondo) => ({
  background: fondo, borderLeft: `4px solid ${color}`, color, padding: '10px 14px', borderRadius: '6px', margin: '12px 0', fontSize: '14px',
});
export const cajaError = mensaje('var(--critico)', 'var(--critico-bg)');
export const cajaAviso = mensaje('var(--riesgo)', 'var(--riesgo-bg)');
export const cajaOk = mensaje('var(--optimo)', 'var(--optimo-bg)');
