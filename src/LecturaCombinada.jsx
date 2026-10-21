import { useEffect, useState } from 'react';
import { api, mensajeError } from './api';
import { colorEstado, fechaCorta } from './utils';
import { cajaError } from './estilos';

const COLOR_PRIORIDAD = { Alta: '#c53030', Media: '#dd6b20', Baja: '#2f855a' };

// Estado psicológico que se combina con el set: la evaluación hecha en esta sesión
// o, si no hay, la última guardada del jugador seleccionado.
async function obtenerEstado(resPsi, tenista) {
  if (resPsi) {
    return { estado: resPsi.estado_psicologico, momentum: resPsi.metricas_consolidadas?.momentum_neto ?? null, origen: 'la evaluación de esta sesión' };
  }
  if (!tenista) return null;
  const { data } = await api.get(`/api/tenistas/${tenista.id}/evaluaciones`, { params: { limite: 1 } });
  if (data.length === 0) return null;
  const e = data[0];
  const pos = e.puntajes?.score_momentum_pos, neg = e.puntajes?.score_momentum_neg;
  return {
    estado: e.estado,
    momentum: typeof pos === 'number' && typeof neg === 'number' ? pos - neg : null,
    origen: `la última evaluación guardada (${fechaCorta(e.fecha)})`,
  };
}

export default function LecturaCombinada({ entrada, resPsi, tenista }) {
  const [lectura, setLectura] = useState(null);
  const [origen, setOrigen] = useState('');
  const [sinEstado, setSinEstado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!entrada) return undefined;
    let activo = true;
    setCargando(true); setError(''); setSinEstado(false); setLectura(null);
    (async () => {
      try {
        const base = await obtenerEstado(resPsi, tenista);
        if (!activo) return;
        if (!base) { setSinEstado(true); return; }
        const { data } = await api.post('/api/recomendacion-combinada', {
          estado_psicologico: base.estado, momentum_neto: base.momentum, telemetria: entrada,
        });
        if (!activo) return;
        setLectura(data); setOrigen(base.origen);
      } catch (err) {
        if (activo) setError(mensajeError(err));
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => { activo = false; };
  }, [entrada, resPsi, tenista?.id]);

  const caja = { marginTop: '16px', padding: '14px', borderRadius: '8px', background: '#f7fafc', border: '1px solid #e2e8f0' };

  if (cargando) return <div style={caja}>Combinando con el estado psicológico...</div>;
  if (error) return <div role="alert" style={cajaError}>{error}</div>;
  if (sinEstado) {
    return (
      <div style={{ ...caja, color: '#4a5568', fontSize: '13px' }}>
        <strong>Lectura combinada:</strong> evalúa primero el estado psicológico (pestaña 1) o selecciona un jugador con una evaluación guardada.
      </div>
    );
  }
  if (!lectura) return null;

  return (
    <div style={{ ...caja, borderLeft: `5px solid ${COLOR_PRIORIDAD[lectura.prioridad]}`, background: 'white' }}>
      <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lectura combinada (estado + set)</span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '6px 0' }}>
        <strong style={{ color: COLOR_PRIORIDAD[lectura.prioridad] }}>Prioridad {lectura.prioridad}</strong>
        <span style={{ fontSize: '12px', color: colorEstado(lectura.fuentes.estado_psicologico), fontWeight: 600 }}>
          Estado: {lectura.fuentes.estado_psicologico}
        </span>
      </div>
      <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{lectura.lectura}</p>
      <div style={{ background: '#edf2f7', padding: '10px', borderRadius: '6px', fontSize: '14px' }}>{lectura.recomendacion_combinada}</div>
      {lectura.notas.map((n) => <p key={n} style={{ margin: '8px 0 0', fontSize: '13px', color: '#9c4221' }}>{n}</p>)}
      <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#718096' }}>Usa {origen}. {lectura.aviso}</p>
    </div>
  );
}
