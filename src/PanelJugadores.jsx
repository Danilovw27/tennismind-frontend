import { useCallback, useEffect, useState } from 'react';
import { api, mensajeError } from './api';
import { VERSION_CONSENTIMIENTO } from './utils';
import { boton, botonSecundario, caja, cajaAviso, cajaError, cajaOk, etiqueta } from './estilos';

export default function PanelJugadores({ seleccionado, onSeleccionar }) {
  const [jugadores, setJugadores] = useState([]);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [codigo, setCodigo] = useState('');
  const [anio, setAnio] = useState('');
  const [nivel, setNivel] = useState('');
  const [otorgadoPor, setOtorgadoPor] = useState('jugador');
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async (idParaSeleccionar) => {
    try {
      const { data } = await api.get('/api/tenistas');
      setJugadores(data);
      const objetivo = idParaSeleccionar ?? seleccionado?.id;
      onSeleccionar(data.find((j) => j.id === objetivo) || null);
    } catch (err) {
      setError(mensajeError(err));
    }
  }, [seleccionado?.id, onSeleccionar]);

  useEffect(() => { cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const ejecutar = async (accion, mensajeOk) => {
    setError(''); setAviso(''); setOcupado(true);
    try {
      const idNuevo = await accion();
      if (mensajeOk) setAviso(mensajeOk);
      await cargar(idNuevo);
    } catch (err) {
      setError(mensajeError(err));
    }
    setOcupado(false);
  };

  const crear = (e) => {
    e.preventDefault();
    ejecutar(async () => {
      const { data } = await api.post('/api/tenistas', {
        codigo: codigo.trim(), anio_nacimiento: parseInt(anio, 10), nivel: nivel.trim() || null,
      });
      setCodigo(''); setAnio(''); setNivel('');
      return data.id;
    }, 'Jugador creado. Registra su consentimiento para poder guardar datos.');
  };

  const consentir = () => ejecutar(async () => {
    await api.post(`/api/tenistas/${seleccionado.id}/consentimiento`, {
      version_texto: VERSION_CONSENTIMIENTO,
      otorgado_por: seleccionado.requiere_representante_legal ? 'representante_legal' : otorgadoPor,
    });
  }, 'Consentimiento registrado.');

  const revocar = () => {
    if (!window.confirm('¿Revocar el consentimiento? No se guardarán nuevos datos de este jugador.')) return;
    ejecutar(async () => { await api.post(`/api/tenistas/${seleccionado.id}/consentimiento/revocar`); },
             'Consentimiento revocado.');
  };

  const eliminar = () => {
    if (!window.confirm(`¿Eliminar al jugador ${seleccionado.codigo} y TODOS sus datos? No se puede deshacer.`)) return;
    ejecutar(async () => { await api.delete(`/api/tenistas/${seleccionado.id}`); return null; },
             'Jugador y datos eliminados.');
  };

  return (
    <div style={{ ...caja, marginBottom: '20px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={etiqueta} htmlFor="jugador">Jugador (código seudónimo)</label>
          <select id="jugador" value={seleccionado?.id ?? ''} style={{ width: '100%', padding: '8px' }}
                  onChange={(e) => onSeleccionar(jugadores.find((j) => j.id === Number(e.target.value)) || null)}>
            <option value="">Sin jugador (solo calcular, sin guardar)</option>
            {jugadores.map((j) => (
              <option key={j.id} value={j.id}>
                {j.codigo}{j.consentimiento_vigente ? '' : ' (sin consentimiento)'}
              </option>
            ))}
          </select>
        </div>

        {seleccionado && !seleccionado.consentimiento_vigente && (
          <div style={{ flex: '1 1 260px' }}>
            {!seleccionado.requiere_representante_legal && (
              <select id="otorgado-por" name="otorgado_por" aria-label="Quién otorga el consentimiento" value={otorgadoPor}
                      onChange={(e) => setOtorgadoPor(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '6px' }}>
                <option value="jugador">Lo otorga el jugador</option>
                <option value="representante_legal">Lo otorga su representante legal</option>
              </select>
            )}
            <button type="button" disabled={ocupado} onClick={consentir} style={boton('#2f855a', ocupado)}>
              Registrar consentimiento
            </button>
          </div>
        )}
        {seleccionado?.consentimiento_vigente && (
          <button type="button" disabled={ocupado} onClick={revocar} style={botonSecundario(ocupado)}>Revocar consentimiento</button>
        )}
        {seleccionado && (
          <button type="button" disabled={ocupado} onClick={eliminar}
                  style={{ ...botonSecundario(ocupado), color: '#c53030', borderColor: '#c53030' }}>
            Eliminar jugador y datos
          </button>
        )}
      </div>

      {seleccionado?.requiere_representante_legal && !seleccionado.consentimiento_vigente && (
        <div style={cajaAviso}>
          Por su edad, el consentimiento debe darlo su representante legal. Registra el consentimiento solo después
          de obtenerlo por escrito con el texto aprobado.
        </div>
      )}
      {seleccionado && !seleccionado.consentimiento_vigente && (
        <div style={cajaAviso}>Sin consentimiento vigente el sistema calcula pero <strong>no guarda</strong> nada de este jugador.</div>
      )}
      {error && <div role="alert" style={cajaError}>{error}</div>}
      {aviso && <div style={cajaOk}>{aviso}</div>}

      <details style={{ marginTop: '12px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '14px', color: '#2b6cb0' }}>Agregar jugador</summary>
        <form onSubmit={crear} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          <input id="nuevo-codigo" name="codigo" autoComplete="off" aria-label="Código" placeholder="Código (p. ej. T05)" required pattern="[A-Za-z0-9_-]{2,20}"
                 title="2 a 20 caracteres: letras, números, guion o guion bajo. No uses nombres reales."
                 value={codigo} onChange={(e) => setCodigo(e.target.value)} style={{ padding: '8px', flex: '1 1 140px' }} />
          <input id="nuevo-anio" name="anio_nacimiento" autoComplete="off" aria-label="Año de nacimiento" type="number" placeholder="Año de nacimiento" required min="1940"
                 max={new Date().getFullYear()} value={anio} onChange={(e) => setAnio(e.target.value)}
                 style={{ padding: '8px', flex: '1 1 140px' }} />
          <input id="nuevo-nivel" name="nivel" autoComplete="off" aria-label="Nivel" placeholder="Nivel (opcional)" value={nivel} onChange={(e) => setNivel(e.target.value)}
                 style={{ padding: '8px', flex: '1 1 140px' }} />
          <button type="submit" disabled={ocupado} style={{ ...botonSecundario(ocupado) }}>Crear</button>
        </form>
        <p style={{ fontSize: '12px', color: '#718096', margin: '6px 0 0' }}>
          Usa un código, nunca el nombre real. Solo se guarda el año de nacimiento.
        </p>
      </details>
    </div>
  );
}
