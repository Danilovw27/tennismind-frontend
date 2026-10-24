import { useEffect, useState } from 'react';
import { api, mensajeError } from './api';
import { colorEstado, fechaCorta } from './utils';
import { EtiquetaEstado } from './iconos';
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

// Cada estado tiene su propia forma, además de su color
function MarcaEstado({ x, y, estado }) {
  const c = colorEstado(estado);
  if (estado === 'Óptimo') return <circle cx={x} cy={y} r="5.5" fill={c} />;
  if (estado === 'Estable') return <rect x={x - 5} y={y - 5} width="10" height="10" fill={c} />;
  if (estado === 'En riesgo') return <polygon points={`${x},${y - 6.5} ${x + 6.5},${y + 5} ${x - 6.5},${y + 5}`} fill={c} />;
  return <polygon points={`${x},${y - 7} ${x + 7},${y} ${x},${y + 7} ${x - 7},${y}`} fill={c} />;
}

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
            <text key={n} x="2" y={alto - margen - i * ((alto - 2 * margen) / 3) + 4} fontSize="9" fill="var(--texto-2)">{n}</text>
          ))}
          <polyline fill="none" stroke="var(--texto-2)" strokeWidth="1.5" points={puntos.map((p) => `${p.x + 30},${p.y}`).join(' ')} />
          {puntos.map((p, i) => <MarcaEstado key={i} x={p.x + 30} y={p.y} estado={p.estado} />)}
        </svg>
      )}

      {filas.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="tabla-resp">
            <thead>
              <tr><th>Fecha</th><th>Estado</th><th>Confianza</th><th>Recomendación</th></tr>
            </thead>
            <tbody>
              {filas.map((e) => (
                <tr key={e.id}>
                  <td data-label="Fecha">{fechaCorta(e.fecha)}</td>
                  <td data-label="Estado"><EtiquetaEstado estado={e.estado} />{e.alerta ? ' ⚠' : ''}</td>
                  <td data-label="Confianza">{e.confianza}%</td>
                  <td data-label="Recomendación">{e.recomendacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ marginBottom: '8px' }}>Observaciones del entrenador</h3>
      {obs.some((o) => o.alerta_activa) && (
        <div role="alert" className="msg msg-error" style={{ fontWeight: 700 }}>
          ⚠ Hay observaciones con alertas de riesgo. Revísalas abajo.
        </div>
      )}
      {obs.length === 0 && <p>Aún no hay observaciones del entrenador.</p>}
      {obs.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="tabla-resp">
            <thead>
              <tr><th>Fecha</th><th>Partido</th><th>Sección</th><th>Puntajes (1-5)</th><th>Alertas</th></tr>
            </thead>
            <tbody>
              {obs.map((o) => (
                <tr key={o.id} className={o.alerta_activa ? 'riesgo-fila' : undefined}>
                  <td data-label="Fecha">{fechaCorta(o.fecha)}</td>
                  <td data-label="Partido">{[o.partido?.torneo, o.partido?.rival_codigo && `vs ${o.partido.rival_codigo}`].filter(Boolean).join(' · ') || `Partido ${o.partido_id}`}</td>
                  <td data-label="Sección">{NOMBRE_SECCION[o.seccion]}{o.set_numero ? ` (set ${o.set_numero})` : ''}</td>
                  <td data-label="Puntajes">{Object.entries(o.puntajes).map(([k, v]) => `${NOMBRE_PUNTAJE[k] || k} ${v.toFixed(1)}`).join(' · ')}</td>
                  <td data-label="Alertas" style={{ color: 'var(--critico)', fontWeight: 600 }}>
                    {o.alertas.map((id) => <div key={id}>⚠ {id}: {TEXTO_ALERTA[id]}</div>)}
                    {o.alertas.length === 0 && o.alerta_activa && <div>⚠ Ítem 29: señales de riesgo altas</div>}
                    {!o.alerta_activa && <span style={{ color: 'var(--texto-2)', fontWeight: 400 }}>—</span>}
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
