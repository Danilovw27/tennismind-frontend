import { useMemo, useState } from 'react';
import { api, mensajeError } from './api';
import { boton, cajaError } from './estilos';
import instrumento from './items.json';

const ITEMS = [...instrumento.items].sort((a, b) => a.numero - b.numero);
const ESCALA = [1, 2, 3, 4, 5];
const ETIQUETAS = instrumento.escala.etiquetas; // { "1": "Nunca", "5": "Siempre" }

// Secciones en el orden de items.json: una por dimensión
const SECCIONES = ITEMS.reduce((acc, it) => {
  const ultima = acc[acc.length - 1];
  if (ultima && ultima.dimension === it.dimension) ultima.items.push(it);
  else acc.push({ variable: it.variable, dimension: it.dimension, items: [it] });
  return acc;
}, []);

export default function FormularioItems({ tenista, guarda, onResultado }) {
  const [respuestas, setRespuestas] = useState({}); // { numero: 1..5 }
  const [faltantes, setFaltantes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const contestadas = useMemo(() => Object.keys(respuestas).length, [respuestas]);

  const elegir = (numero, valor) => {
    setRespuestas((r) => ({ ...r, [numero]: valor }));
    setFaltantes((f) => f.filter((n) => n !== numero));
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    const sinResponder = ITEMS.filter((it) => !respuestas[it.numero]).map((it) => it.numero);
    setFaltantes(sinResponder);
    if (sinResponder.length > 0) {
      setError(`Faltan ${sinResponder.length} ítems por responder: ${sinResponder.join(', ')}.`);
      document.getElementById(`item-${sinResponder[0]}`)?.scrollIntoView({ block: 'center' });
      return;
    }
    const lista = ITEMS.map((it) => respuestas[it.numero]);
    setCargando(true);
    try {
      const { data } = guarda
        ? await api.post(`/api/tenistas/${tenista.id}/evaluaciones-items`, { respuestas: lista })
        : await api.post('/api/evaluacion/clasificar-items', { id_tenista: tenista?.codigo || 'T01', respuestas: lista });
      onResultado(data, guarda);
    } catch (err) {
      setError(mensajeError(err));
    }
    setCargando(false);
  };

  return (
    <form onSubmit={enviar} noValidate>
      <p style={{ fontSize: '13px', color: 'var(--texto-2)', marginTop: 0 }}>
        Responde los {ITEMS.length} ítems de 1 ({ETIQUETAS['1']}) a 5 ({ETIQUETAS['5']}).
        {' '}<strong>{contestadas}/{ITEMS.length}</strong> respondidos.
      </p>

      {SECCIONES.map((sec) => (
        <fieldset key={sec.dimension} style={{ border: '1px solid var(--borde)', borderRadius: '6px', margin: '0 0 12px 0', padding: '8px 12px', background: 'white' }}>
          <legend style={{ fontSize: '13px', fontWeight: 700, color: 'var(--marca)', padding: '0 6px' }}>
            {sec.dimension} <span style={{ fontWeight: 400, color: 'var(--texto-2)' }}>· {sec.variable}</span>
          </legend>
          {sec.items.map((it) => {
            const falta = faltantes.includes(it.numero);
            return (
              <div key={it.numero} id={`item-${it.numero}`}
                   style={{ padding: '8px 0', borderBottom: '1px solid var(--suave)', borderLeft: falta ? '3px solid var(--critico)' : '3px solid transparent', paddingLeft: '8px' }}>
                <div style={{ fontSize: '14px', marginBottom: '6px' }}>
                  <strong>{it.numero}.</strong> {it.texto}
                </div>
                <div role="radiogroup" aria-label={`Ítem ${it.numero}`} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--texto-2)', width: '46px' }}>{ETIQUETAS['1']}</span>
                  {ESCALA.map((v) => (
                    <label key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '12px', cursor: 'pointer', minWidth: '28px' }}>
                      <input type="radio" name={`item-${it.numero}`} value={v}
                             checked={respuestas[it.numero] === v} onChange={() => elegir(it.numero, v)} />
                      {v}
                    </label>
                  ))}
                  <span style={{ fontSize: '11px', color: 'var(--texto-2)' }}>{ETIQUETAS['5']}</span>
                </div>
              </div>
            );
          })}
        </fieldset>
      ))}

      {error && <div role="alert" style={cajaError}>{error}</div>}
      <button type="submit" disabled={cargando} style={boton('var(--marca)', cargando)}>
        {cargando ? 'Evaluando...' : guarda ? 'Evaluar y guardar en historial' : 'Evaluar (sin guardar)'}
      </button>
    </form>
  );
}
