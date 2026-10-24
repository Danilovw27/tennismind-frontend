import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, mensajeError } from './api';
import { fechaCorta } from './utils';
import { boton, botonSecundario, cajaAviso, cajaError, cajaOk } from './estilos';
import instrumento from './items_observacion.json';

const ITEMS = instrumento.items;
const ESCALA = [1, 2, 3, 4, 5];
const ETIQUETAS = instrumento.escala.etiquetas;
const PASOS = [['A', 'A. Antes'], ['B', 'B. Durante (por set)'], ['C', 'C. Después']];
// Preguntas cualitativas que se piden en cada paso (D son las intervenciones en los cambios de lado)
const PREGUNTAS_POR_PASO = { A: [], B: ['D'], C: ['A', 'B', 'C'] };
const PREGUNTAS = Object.fromEntries(instrumento.analisis_cualitativo.map((q) => [q.id, q.pregunta]));
const PASO_CON_ALERTAS = { A: false, B: true, C: true };

const itemsDe = (paso) => {
  const [desde, hasta] = instrumento.secciones[paso].items;
  return ITEMS.filter((it) => it.numero >= desde && it.numero <= hasta);
};
const agrupar = (items) => items.reduce((acc, it) => {
  const ultimo = acc[acc.length - 1];
  if (ultimo && ultimo.dimension === it.dimension) ultimo.items.push(it);
  else acc.push({ dimension: it.dimension, items: [it] });
  return acc;
}, []);

const vacio = () => ({ respuestas: {}, notas: {}, alertas: [], analisis: {}, resultado: '' });

export default function Observacion({ tenista, onGuardado }) {
  const [partidos, setPartidos] = useState([]);
  const [partidoId, setPartidoId] = useState('');
  const [guardadas, setGuardadas] = useState([]);
  const [paso, setPaso] = useState('A');
  const [setNumero, setSetNumero] = useState(1);
  const [form, setForm] = useState(vacio());
  const [nuevo, setNuevo] = useState({ rival_codigo: '', torneo: '', superficie: '' });
  const [faltantes, setFaltantes] = useState([]);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const puede = Boolean(tenista?.consentimiento_vigente);

  const cargarGuardadas = useCallback(async (id) => {
    if (!id) { setGuardadas([]); return; }
    const { data } = await api.get(`/api/partidos/${id}/observaciones`);
    setGuardadas(data);
  }, []);

  // Partidos del jugador
  useEffect(() => {
    setPartidos([]); setPartidoId(''); setGuardadas([]); setForm(vacio()); setError(''); setAviso('');
    if (!tenista) return;
    api.get(`/api/tenistas/${tenista.id}/partidos`)
      .then(({ data }) => { setPartidos(data); if (data[0]) setPartidoId(String(data[0].id)); })
      .catch((err) => setError(mensajeError(err)));
  }, [tenista?.id]);

  useEffect(() => {
    cargarGuardadas(partidoId).catch((err) => setError(mensajeError(err)));
    setForm(vacio()); setFaltantes([]);
  }, [partidoId, cargarGuardadas]);

  const yaA = guardadas.some((o) => o.seccion === 'A');
  const yaC = guardadas.some((o) => o.seccion === 'C');
  const setsB = guardadas.filter((o) => o.seccion === 'B').map((o) => o.set_numero);
  const yaGuardado = (paso === 'A' && yaA) || (paso === 'C' && yaC);
  const items = useMemo(() => itemsDe(paso), [paso]);

  useEffect(() => {
    if (paso === 'B' && setsB.includes(setNumero)) {
      const libre = [1, 2, 3, 4, 5].find((n) => !setsB.includes(n));
      if (libre) setSetNumero(libre);
    }
  }, [paso, guardadas]); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiarPaso = (p) => { setPaso(p); setForm(vacio()); setFaltantes([]); setError(''); setAviso(''); };

  const crearPartido = async () => {
    setError(''); setAviso(''); setOcupado(true);
    try {
      const cuerpo = Object.fromEntries(Object.entries(nuevo).map(([k, v]) => [k, v.trim() || null]));
      const { data } = await api.post(`/api/tenistas/${tenista.id}/partidos`, cuerpo);
      setPartidos((l) => [data, ...l]); setPartidoId(String(data.id));
      setNuevo({ rival_codigo: '', torneo: '', superficie: '' });
    } catch (err) { setError(mensajeError(err)); }
    setOcupado(false);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError(''); setAviso('');
    const sin = items.filter((it) => !form.respuestas[it.numero]).map((it) => it.numero);
    setFaltantes(sin);
    if (sin.length) {
      setError(`Faltan ${sin.length} ítems por responder: ${sin.join(', ')}.`);
      document.getElementById(`obs-${sin[0]}`)?.scrollIntoView({ block: 'center' });
      return;
    }
    const limpio = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v.trim()));
    const cuerpo = {
      seccion: paso,
      respuestas: form.respuestas,
      notas: limpio(form.notas),
      alertas: form.alertas,
      analisis: limpio(form.analisis),
    };
    if (paso === 'B') {
      cuerpo.set_numero = setNumero;
      if (form.resultado.trim()) cuerpo.resultado_set = form.resultado.trim();
    }
    setOcupado(true);
    try {
      await api.post(`/api/partidos/${partidoId}/observaciones`, cuerpo);
      setAviso(paso === 'B' ? `Sección B del set ${setNumero} guardada.` : `Sección ${paso} guardada.`);
      setForm(vacio());
      await cargarGuardadas(partidoId);
      onGuardado?.();
    } catch (err) { setError(mensajeError(err)); }
    setOcupado(false);
  };

  if (!tenista) return <div style={cajaAviso}>Selecciona un jugador para registrar observaciones.</div>;
  if (!puede) return <div style={cajaAviso}>Este jugador no tiene consentimiento vigente: registra el consentimiento para guardar observaciones.</div>;

  const marca = (p) => (p === 'A' ? yaA : p === 'C' ? yaC : setsB.length > 0);
  const caja = { background: 'var(--fondo)', padding: '20px', borderRadius: '8px', border: '1px solid var(--borde)' };
  const campo = { padding: '6px', flex: '1 1 120px' };

  return (
    <div style={caja}>
      <h3 style={{ marginTop: 0 }}>Observación del entrenador</h3>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '12px' }}>
        <div style={{ flex: '1 1 240px' }}>
          <label style={{ fontSize: '12px', color: 'var(--texto-2)' }} htmlFor="obs-partido">Partido</label>
          <select id="obs-partido" value={partidoId} onChange={(e) => setPartidoId(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="">{partidos.length ? 'Elige un partido' : 'Aún no hay partidos: crea uno'}</option>
            {partidos.map((p) => (
              <option key={p.id} value={p.id}>
                {fechaCorta(p.fecha)}{p.torneo ? ` · ${p.torneo}` : ''}{p.rival_codigo ? ` · vs ${p.rival_codigo}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      <details style={{ marginBottom: '12px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--marca)' }}>Nuevo partido</summary>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
          <input aria-label="Código del rival" placeholder="Código del rival (p. ej. R01)" maxLength={40} value={nuevo.rival_codigo}
                 onChange={(e) => setNuevo({ ...nuevo, rival_codigo: e.target.value })} style={campo} />
          <input aria-label="Torneo" placeholder="Torneo" maxLength={80} value={nuevo.torneo}
                 onChange={(e) => setNuevo({ ...nuevo, torneo: e.target.value })} style={campo} />
          <input aria-label="Superficie" placeholder="Superficie" maxLength={30} value={nuevo.superficie}
                 onChange={(e) => setNuevo({ ...nuevo, superficie: e.target.value })} style={campo} />
          <button type="button" disabled={ocupado} onClick={crearPartido} style={botonSecundario(ocupado)}>Crear partido</button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--texto-2)', margin: '6px 0 0' }}>Usa códigos, nunca nombres reales del rival.</p>
      </details>

      {!partidoId ? <div style={cajaAviso}>Elige o crea un partido para empezar.</div> : (
        <>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {PASOS.map(([p, titulo]) => (
              <button key={p} type="button" onClick={() => cambiarPaso(p)}
                      style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--marca)', fontWeight: 600, cursor: 'pointer',
                               background: paso === p ? 'var(--marca)' : 'white', color: paso === p ? 'white' : 'var(--marca)' }}>
                {titulo}{marca(p) ? ' ✓' : ''}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--texto-2)', margin: '0 0 12px' }}>
            <strong>{instrumento.secciones[paso].momento}.</strong> {instrumento.secciones[paso].instruccion}
          </p>

          {aviso && <div style={cajaOk}>{aviso}</div>}

          {yaGuardado ? (
            <div style={cajaAviso}>La sección {paso} de este partido ya está registrada (se guarda una sola vez por partido).</div>
          ) : (
            <form onSubmit={guardar} noValidate>
              {paso === 'B' && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--texto-2)' }} htmlFor="obs-set">Set nº</label>
                    <select id="obs-set" value={setNumero} onChange={(e) => setSetNumero(Number(e.target.value))} style={{ display: 'block', padding: '6px' }}>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n} disabled={setsB.includes(n)}>{n}{setsB.includes(n) ? ' (ya registrado)' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--texto-2)' }} htmlFor="obs-resultado">Resultado del set (opcional, p. ej. 6-4)</label>
                    <input id="obs-resultado" value={form.resultado} maxLength={20} pattern="\d{1,2}-\d{1,2}(\(\d{1,2}\))?"
                           onChange={(e) => setForm({ ...form, resultado: e.target.value })} style={{ display: 'block', padding: '6px', width: '120px' }} />
                  </div>
                </div>
              )}

              {agrupar(items).map((g) => (
                <fieldset key={g.dimension} style={{ border: '1px solid var(--borde)', borderRadius: '6px', margin: '0 0 12px', padding: '8px 12px', background: 'white' }}>
                  <legend style={{ fontSize: '13px', fontWeight: 700, color: 'var(--marca)', padding: '0 6px' }}>{g.dimension}</legend>
                  {g.items.map((it) => (
                    <div key={it.numero} id={`obs-${it.numero}`}
                         style={{ padding: '8px 0 8px 8px', borderBottom: '1px solid var(--suave)', borderLeft: faltantes.includes(it.numero) ? '3px solid var(--critico)' : '3px solid transparent' }}>
                      <div style={{ fontSize: '14px', marginBottom: '6px' }}><strong>{it.numero}.</strong> {it.texto}</div>
                      <div role="radiogroup" aria-label={`Ítem ${it.numero}`} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {ESCALA.map((v) => (
                          <label key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '11px', cursor: 'pointer', minWidth: '62px', color: 'var(--texto-2)' }}>
                            <input type="radio" name={`obs-${it.numero}`} value={v} checked={form.respuestas[it.numero] === v}
                                   onChange={() => { setForm({ ...form, respuestas: { ...form.respuestas, [it.numero]: v } }); setFaltantes((f) => f.filter((n) => n !== it.numero)); }} />
                            {v} · {ETIQUETAS[v]}
                          </label>
                        ))}
                      </div>
                      <input aria-label={`Nota del ítem ${it.numero}`} placeholder="Nota (opcional)" maxLength={300}
                             value={form.notas[it.numero] || ''} onChange={(e) => setForm({ ...form, notas: { ...form.notas, [it.numero]: e.target.value } })}
                             style={{ width: '97%', marginTop: '6px', padding: '4px', fontSize: '12px' }} />
                    </div>
                  ))}
                </fieldset>
              ))}

              {PASO_CON_ALERTAS[paso] && (
                <fieldset style={{ border: '1px solid var(--critico)', borderRadius: '6px', margin: '0 0 12px', padding: '8px 12px', background: 'var(--critico-bg)' }}>
                  <legend style={{ fontSize: '13px', fontWeight: 700, color: 'var(--critico)', padding: '0 6px' }}>Alertas de riesgo observadas</legend>
                  {instrumento.alertas_riesgo.map((a) => (
                    <label key={a.id} style={{ display: 'block', fontSize: '14px', padding: '3px 0' }}>
                      <input type="checkbox" checked={form.alertas.includes(a.id)}
                             onChange={(e) => setForm({ ...form, alertas: e.target.checked ? [...form.alertas, a.id] : form.alertas.filter((x) => x !== a.id) })} />
                      {' '}<strong>{a.id}</strong> {a.texto}
                    </label>
                  ))}
                </fieldset>
              )}

              {PREGUNTAS_POR_PASO[paso].length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={cajaAviso}>
                    En los textos libres no escribas nombres ni datos de salud: usa solo códigos y descripciones de conducta (máximo 1000 caracteres).
                  </div>
                  {PREGUNTAS_POR_PASO[paso].map((id) => (
                    <div key={id} style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }} htmlFor={`obs-q-${id}`}>{PREGUNTAS[id]}</label>
                      <textarea id={`obs-q-${id}`} rows={3} maxLength={1000} value={form.analisis[id] || ''}
                                onChange={(e) => setForm({ ...form, analisis: { ...form.analisis, [id]: e.target.value } })}
                                style={{ width: '97%', padding: '6px' }} />
                    </div>
                  ))}
                </div>
              )}

              {error && <div role="alert" style={cajaError}>{error}</div>}
              <button type="submit" disabled={ocupado} style={boton('var(--marca)', ocupado)}>
                {ocupado ? 'Guardando...' : paso === 'B' ? `Guardar sección B del set ${setNumero}` : `Guardar sección ${paso}`}
              </button>
            </form>
          )}
          {yaGuardado && error && <div role="alert" style={cajaError}>{error}</div>}
        </>
      )}
    </div>
  );
}
