import { useEffect, useState } from 'react';
import { api, mensajeError } from './api';
import { colorEstado, fechaCorta } from './utils';
import { cajaAviso, cajaError, tarjeta } from './estilos';
import instrumento from './items_observacion.json';

const TEXTO_ALERTA = Object.fromEntries(instrumento.alertas_riesgo.map((a) => [a.id, a.texto]));
const NOMBRE_PUNTAJE = {
  score_ansiedad_cog: 'Ansiedad cog.', score_ansiedad_som: 'Ansiedad som.', score_autoconfianza: 'Autoconfianza',
  score_momentum_pos: 'Momentum +', score_momentum_neg: 'Momentum −', score_resiliencia: 'Resiliencia',
  score_ctrl_emocional: 'Ctrl. emocional', score_foco_atencional: 'Foco', score_perseverancia: 'Perseverancia',
  score_rutinas_conc: 'Rutinas',
};
const NOMBRE_SECCION = { A: 'A · antes', B: 'B · durante', C: 'C · después' };

export default function Historial({ tenista, refresco }) {
  const [filas, setFilas] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [obs, setObs] = useState([]);

  useEffect(() => {
    if (!tenista) { setFilas([]); return; }
    let activo = true;
    setCargando(true); setError('');
    api.get(`/api/tenistas/${tenista.id}/evaluaciones`)
      .then(({ data }) => { if (activo) setFilas(data); })
      .catch((err) => { if (activo) setError(mensajeError(err)); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [tenista?.id, refresco]);

  useEffect(() => {
    if (!tenista) { setObs([]); return undefined; }
    let activo = true;
    api.get(`/api/tenistas/${tenista.id}/observaciones`)
      .then(({ data }) => { if (activo) setObs(data); })
      .catch((err) => { if (activo) setError(mensajeError(err)); });
    return () => { activo = false; };
  }, [tenista?.id, refresco]);

  if (!tenista) return <div style={cajaAviso}>Selecciona un jugador para ver su historial.</div>;

  const cronologico = [...filas].reverse();
  const ancho = 520, alto = 120, margen = 24;
  const paso = cronologico.length > 1 ? (ancho - 2 * margen) / (cronologico.length - 1) : 0;
  const nivel = { 'Crítico': 0, 'En riesgo': 1, 'Estable': 2, 'Óptimo': 3 };
  const puntos = cronologico.map((e, i) => ({
    x: margen + i * paso, y: alto - margen - (nivel[e.estado] ?? 0) * ((alto - 2 * margen) / 3), estado: e.estado,
  }));

  return (
    <div style={tarjeta}>
      <h3 style={{ marginTop: 0 }}>Historial de {tenista.codigo}</h3>
      {cargando && <p>Cargando...</p>}
      {error && <div role="alert" style={cajaError}>{error}</div>}
      {!cargando && !error && filas.length === 0 && <p>Aún no hay evaluaciones guardadas.</p>}

      {cronologico.length > 1 && (
        <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label="Evolución del estado psicológico" style={{ width: '100%', maxWidth: ancho }}>
          {['Crítico', 'En riesgo', 'Estable', 'Óptimo'].map((n, i) => (
            <text key={n} x="2" y={alto - margen - i * ((alto - 2 * margen) / 3) + 4} fontSize="9" fill="#718096">{n}</text>
          ))}
          <polyline fill="none" stroke="#a0aec0" strokeWidth="1.5" points={puntos.map((p) => `${p.x + 30},${p.y}`).join(' ')} />
          {puntos.map((p, i) => <circle key={i} cx={p.x + 30} cy={p.y} r="5" fill={colorEstado(p.estado)} />)}
        </svg>
      )}

      {filas.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th>Fecha</th><th>Estado</th><th>Confianza</th><th>Recomendación</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '6px 8px 6px 0' }}>{fechaCorta(e.fecha)}</td>
                  <td style={{ color: colorEstado(e.estado), fontWeight: 600 }}>{e.estado}{e.alerta ? ' ⚠' : ''}</td>
                  <td>{e.confianza}%</td>
                  <td>{e.recomendacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ marginBottom: '8px' }}>Observaciones del entrenador</h3>
      {obs.some((o) => o.alerta_activa) && (
        <div role="alert" style={{ ...cajaAviso, borderLeftColor: '#e53e3e', background: '#fff5f5', color: '#9b2c2c', fontWeight: 600 }}>
          ⚠ Hay observaciones con alertas de riesgo. Revísalas abajo.
        </div>
      )}
      {obs.length === 0 && <p>Aún no hay observaciones del entrenador.</p>}
      {obs.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th>Fecha</th><th>Partido</th><th>Sección</th><th>Puntajes (1-5)</th><th>Alertas</th>
              </tr>
            </thead>
            <tbody>
              {obs.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #edf2f7', verticalAlign: 'top', background: o.alerta_activa ? '#fff5f5' : undefined }}>
                  <td style={{ padding: '6px 8px 6px 0' }}>{fechaCorta(o.fecha)}</td>
                  <td>{[o.partido?.torneo, o.partido?.rival_codigo && `vs ${o.partido.rival_codigo}`].filter(Boolean).join(' · ') || `Partido ${o.partido_id}`}</td>
                  <td>{NOMBRE_SECCION[o.seccion]}{o.set_numero ? ` (set ${o.set_numero})` : ''}</td>
                  <td>{Object.entries(o.puntajes).map(([k, v]) => `${NOMBRE_PUNTAJE[k] || k} ${v.toFixed(1)}`).join(' · ')}</td>
                  <td style={{ color: '#c53030' }}>
                    {o.alertas.map((id) => <div key={id}>⚠ {id}: {TEXTO_ALERTA[id]}</div>)}
                    {o.alertas.length === 0 && o.alerta_activa && <div>⚠ Ítem 29: señales de riesgo altas</div>}
                    {!o.alerta_activa && '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
