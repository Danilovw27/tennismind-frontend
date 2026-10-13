export const caja = { background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' };
export const tarjeta = { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
export const etiqueta = { fontSize: '12px', color: '#4a5568' };
export const entrada = { width: '90%', padding: '6px' };

export const boton = (color = '#3182ce', deshabilitado = false) => ({
  width: '100%', padding: '12px', background: color, color: 'white', border: 'none',
  borderRadius: '6px', fontWeight: 'bold',
  cursor: deshabilitado ? 'not-allowed' : 'pointer', opacity: deshabilitado ? 0.5 : 1,
});

export const botonSecundario = (deshabilitado = false) => ({
  padding: '8px 12px', background: 'white', color: '#2b6cb0', border: '1px solid #2b6cb0',
  borderRadius: '6px', fontWeight: '600', cursor: deshabilitado ? 'not-allowed' : 'pointer',
  opacity: deshabilitado ? 0.5 : 1,
});

export const cajaError = {
  background: '#fff5f5', borderLeft: '4px solid #e53e3e', color: '#9b2c2c',
  padding: '10px 14px', borderRadius: '4px', margin: '12px 0', fontSize: '14px',
};
export const cajaAviso = {
  background: '#fffaf0', borderLeft: '4px solid #dd6b20', color: '#9c4221',
  padding: '10px 14px', borderRadius: '4px', margin: '12px 0', fontSize: '13px',
};
export const cajaOk = {
  background: '#f0fff4', borderLeft: '4px solid #38a169', color: '#276749',
  padding: '10px 14px', borderRadius: '4px', margin: '12px 0', fontSize: '13px',
};
