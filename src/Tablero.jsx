import { useEffect, useState } from 'react';
import { api, mensajeError } from './api';
import { colorEstado } from './utils';
import Historial from './Historial';
import { boton, cajaAviso, cajaError, cajaOk } from './estilos';

function Tablero({ tenista }) {
  const [tabActiva, setTabActiva] = useState('psicologico'); // 'psicologico' o 'tactico'

  // Estado: Formulario Psicométrico (Modelo A)
  const [formPsi, setFormPsi] = useState({
    id_tenista: 'T01',
    score_ansiedad_cog: 3.0,
    score_ansiedad_som: 3.0,
    score_autoconfianza: 3.0,
    score_momentum_pos: 3.0,
    score_momentum_neg: 3.0,
    score_resiliencia: 3.0,
    score_ctrl_emocional: 3.0,
    score_foco_atencional: 3.0,
    score_perseverancia: 3.0,
    score_rutinas_conc: 3.0,
  });
  const [resPsi, setResPsi] = useState(null);
  const [loadingPsi, setLoadingPsi] = useState(false);

  // Estado: Formulario Telemetría / Set (Modelo B)
  const [formSet, setFormSet] = useState({
    p1_juegos: 3,
    p2_juegos: 2,
    saque_p1: true,
    p1_aces: 4,
    p2_aces: 2,
    p1_dobles_faltas: 1,
    p2_dobles_faltas: 3,
    p1_errores_noforzados: 6,
    p2_errores_noforzados: 12,
    p1_break_points_ganados: 2,
    p2_break_points_ganados: 0,
    p1_break_points_totales: 3,
    p2_break_points_totales: 1,
    puntos_totales_disputados: 30,
  });
  const [resSet, setResSet] = useState(null);
  const [errorPsi, setErrorPsi] = useState('');
  const [errorSet, setErrorSet] = useState('');
  const [guardadoPsi, setGuardadoPsi] = useState(false);
  const [guardadoSet, setGuardadoSet] = useState(false);
  const [partido, setPartido] = useState(null);
  const [setNumero, setSetNumero] = useState(1);
  const [refresco, setRefresco] = useState(0);
  const guarda = Boolean(tenista?.consentimiento_vigente);

  // Al cambiar de jugador se limpian resultados y el partido en curso
  useEffect(() => {
    setResPsi(null); setResSet(null); setPartido(null); setErrorPsi(''); setErrorSet('');
    setGuardadoPsi(false); setGuardadoSet(false); setSetNumero(1);
  }, [tenista?.id]);
  const [loadingSet, setLoadingSet] = useState(false);

  // Manejadores
  const handlePsiChange = (e) => {
    setFormPsi({ ...formPsi, [e.target.name]: parseFloat(e.target.value) });
  };

  const handleSetChange = (e) => {
    const { name, value } = e.target;
    if (name === 'saque_p1') {
      setFormSet({ ...formSet, saque_p1: value === 'true' });
      return;
    }
    setFormSet({ ...formSet, [name]: parseInt(value, 10) || 0 });
  };

  const analizarPsicologia = async (e) => {
    e.preventDefault();
    setLoadingPsi(true); setErrorPsi('');
    try {
      const { id_tenista, ...puntajes } = formPsi;
      const res = guarda
        ? await api.post(`/api/tenistas/${tenista.id}/evaluaciones`, puntajes)
        : await api.post('/api/evaluacion/clasificar', { id_tenista: tenista?.codigo || id_tenista, ...puntajes });
      setResPsi(res.data);
      setGuardadoPsi(guarda);
      if (guarda) setRefresco((n) => n + 1);
    } catch (err) {
      setErrorPsi(mensajeError(err));
    }
    setLoadingPsi(false);
  };

  const iniciarPartido = async () => {
    setErrorSet('');
    try {
      const { data } = await api.post(`/api/tenistas/${tenista.id}/partidos`, {});
      setPartido(data); setSetNumero(1);
    } catch (err) {
      setErrorSet(mensajeError(err));
    }
  };

  const analizarSet = async (e) => {
    e.preventDefault();
    setLoadingSet(true); setErrorSet('');
    try {
      const guardar = guarda && partido;
      const res = guardar
        ? await api.post(`/api/partidos/${partido.id}/mediciones`, { ...formSet, set_numero: setNumero })
        : await api.post('/api/partido/probabilidad-set', formSet);
      setResSet(res.data);
      setGuardadoSet(Boolean(guardar));
    } catch (err) {
      setErrorSet(mensajeError(err));
    }
    setLoadingSet(false);
  };

  const getColorEstado = colorEstado;

  return (
    <div>
      {/* Selector de Módulos */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
        <button
          onClick={() => setTabActiva('psicologico')}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: tabActiva === 'psicologico' ? '#2b6cb0' : '#edf2f7',
            color: tabActiva === 'psicologico' ? 'white' : '#4a5568',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          1. Estado Psicológico (CSAI-2 / AI)
        </button>
        <button
          onClick={() => setTabActiva('tactico')}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: tabActiva === 'tactico' ? '#2b6cb0' : '#edf2f7',
            color: tabActiva === 'tactico' ? 'white' : '#4a5568',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          2. Probabilidad de Set (Telemetría Grand Slam)
        </button>
        <button
          onClick={() => setTabActiva('historial')}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: tabActiva === 'historial' ? '#2b6cb0' : '#edf2f7',
            color: tabActiva === 'historial' ? 'white' : '#4a5568',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          3. Historial
        </button>
      </div>

      {/* MÓDULO 1: ESTADO PSICOLÓGICO */}
      {tabActiva === 'psicologico' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0 }}>Registro Rápido de Descanso</h3>
            <form onSubmit={analizarPsicologia}>
              {Object.keys(formPsi).map((key) => {
                if (key === 'id_tenista') return null;
                const label = key.replace('score_', '').replace(/_/g, ' ');
                return (
                  <div key={key} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', textTransform: 'capitalize' }}>
                      <span>{label}</span>
                      <strong>{formPsi[key].toFixed(1)}</strong>
                    </div>
                    <input
                      type="range"
                      name={key}
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={formPsi[key]}
                      onChange={handlePsiChange}
                      style={{ width: '100%' }}
                    />
                  </div>
                );
              })}
              <button
                type="submit"
                disabled={loadingPsi}
                style={{ width: '100%', padding: '12px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {loadingPsi ? 'Evaluando...' : guarda ? 'Evaluar y guardar en historial' : 'Evaluar (sin guardar)'}
              </button>
              {errorPsi && <div role="alert" style={cajaError}>{errorPsi}</div>}
            </form>
          </div>

          <div>
            {resPsi ? (
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', borderTop: `6px solid ${getColorEstado(resPsi.estado_psicologico)}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                {guardadoPsi && <div style={cajaOk}>Evaluación guardada en el historial.</div>}
                <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnóstico Actual</span>
                <h2 style={{ margin: '4px 0 16px 0', color: getColorEstado(resPsi.estado_psicologico) }}>
                  {resPsi.estado_psicologico}
                </h2>

                {resPsi.alerta_activa && (
                  <div style={{ background: '#fffaf0', borderLeft: '4px solid #dd6b20', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', color: '#9c4221', fontWeight: '600' }}>
                    Alerta de Intervención Requerida
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', color: '#718096', fontWeight: '600' }}>DIRECTIVA PARA EL ENTRENADOR</label>
                  <div style={{ background: '#edf2f7', padding: '12px', borderRadius: '6px', marginTop: '4px', fontSize: '15px' }}>
                    {resPsi.recomendacion_entrenador}
                  </div>
                </div>

                <div style={{ marginBottom: '16px', fontSize: '13px', color: '#4a5568' }}>
                  <strong>Confianza del modelo:</strong> {resPsi.confianza_prediccion_pct}%
                  {resPsi.probabilidades_por_clase_pct && Object.entries(resPsi.probabilidades_por_clase_pct).map(([clase, p]) => (
                    <div key={clase} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{ width: '70px' }}>{clase}</span>
                      <div style={{ flex: 1, background: '#edf2f7', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${p}%`, height: '100%', background: getColorEstado(clase) }} />
                      </div>
                      <span style={{ width: '44px', textAlign: 'right' }}>{p}%</span>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '13px', color: '#4a5568', background: '#f7fafc', padding: '12px', borderRadius: '6px' }}>
                  <strong>Métricas Consolidadas:</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <div>Ansiedad: {resPsi.metricas_consolidadas.ansiedad_total}</div>
                    <div>Fortaleza: {resPsi.metricas_consolidadas.fortaleza_total}</div>
                    <div>Concentración: {resPsi.metricas_consolidadas.concentracion_total}</div>
                    <div>Momentum Neto: {resPsi.metricas_consolidadas.momentum_neto}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '2px dashed #cbd5e0', borderRadius: '8px', color: '#a0aec0', padding: '40px', textAlign: 'center' }}>
                Ajuste las variables y ejecute la evaluación para generar el diagnóstico en tiempo real.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MÓDULO 2: TELEMETRÍA Y SET */}
      {tabActiva === 'tactico' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0 }}>Telemetría del Set en Curso</h3>
            {guarda && !partido && (
              <div style={cajaAviso}>
                Para guardar las mediciones, inicia un partido.
                <button type="button" onClick={iniciarPartido} style={{ ...boton('#2c5282'), marginTop: '8px' }}>Iniciar partido</button>
              </div>
            )}
            {guarda && partido && (
              <div style={{ ...cajaOk, display: 'flex', gap: '8px', alignItems: 'center' }}>
                Partido en curso. Set nº
                <input type="number" min="1" max="5" value={setNumero} aria-label="Número de set"
                       onChange={(e) => setSetNumero(Math.min(5, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                       style={{ width: '56px', padding: '4px' }} />
              </div>
            )}
            {!guarda && <div style={cajaAviso}>Modo cálculo: no se guardará nada (selecciona un jugador con consentimiento para guardar).</div>}
            <form onSubmit={analizarSet}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#4a5568' }}>Aces (Jugador)</label>
                  <input type="number" name="p1_aces" value={formSet.p1_aces} onChange={handleSetChange} style={{ width: '90%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#4a5568' }}>Aces (Rival)</label>
                  <input type="number" name="p2_aces" value={formSet.p2_aces} onChange={handleSetChange} style={{ width: '90%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#4a5568' }}>Dobles Faltas (J1)</label>
                  <input type="number" name="p1_dobles_faltas" value={formSet.p1_dobles_faltas} onChange={handleSetChange} style={{ width: '90%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#4a5568' }}>Dobles Faltas (Rival)</label>
                  <input type="number" name="p2_dobles_faltas" value={formSet.p2_dobles_faltas} onChange={handleSetChange} style={{ width: '90%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#4a5568' }}>Errores No Forzados (J1)</label>
                  <input type="number" name="p1_errores_noforzados" value={formSet.p1_errores_noforzados} onChange={handleSetChange} style={{ width: '90%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#4a5568' }}>Errores No Forzados (Rival)</label>
                  <input type="number" name="p2_errores_noforzados" value={formSet.p2_errores_noforzados} onChange={handleSetChange} style={{ width: '90%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#4a5568' }}>Break Points Ganados (J1)</label>
                  <input type="number" name="p1_break_points_ganados" value={formSet.p1_break_points_ganados} onChange={handleSetChange} style={{ width: '90%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#4a5568' }}>Break Points Ganados (Rival)</label>
                  <input type="number" name="p2_break_points_ganados" value={formSet.p2_break_points_ganados} onChange={handleSetChange} style={{ width: '90%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#4a5568' }}>Break Points Totales (J1)</label>
                  <input type="number" min="0" name="p1_break_points_totales" value={formSet.p1_break_points_totales} onChange={handleSetChange} style={{ width: '90%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#4a5568' }}>Break Points Totales (Rival)</label>
                  <input type="number" min="0" name="p2_break_points_totales" value={formSet.p2_break_points_totales} onChange={handleSetChange} style={{ width: '90%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#4a5568' }}>Juegos en el set (Jugador)</label>
                  <input type="number" min="0" max="7" name="p1_juegos" value={formSet.p1_juegos} onChange={handleSetChange} style={{ width: '90%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#4a5568' }}>Juegos en el set (Rival)</label>
                  <input type="number" min="0" max="7" name="p2_juegos" value={formSet.p2_juegos} onChange={handleSetChange} style={{ width: '90%', padding: '6px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#4a5568' }}>Saca el próximo punto</label>
                <select name="saque_p1" value={String(formSet.saque_p1)} onChange={handleSetChange} style={{ width: '95%', padding: '6px' }}>
                  <option value="true">Jugador</option>
                  <option value="false">Rival</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#4a5568' }}>Puntos Jugados en el Set (hasta ahora)</label>
                <input type="number" name="puntos_totales_disputados" value={formSet.puntos_totales_disputados} onChange={handleSetChange} style={{ width: '95%', padding: '6px' }} />
              </div>

              <button
                type="submit"
                disabled={loadingSet}
                style={{ width: '100%', padding: '12px', background: '#2c5282', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {loadingSet ? 'Calculando...' : 'Calcular Probabilidad de Set'}
              </button>
              {errorSet && <div role="alert" style={cajaError}>{errorSet}</div>}
            </form>
          </div>

          <div>
            {resSet ? (
              <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                {guardadoSet && <div style={cajaOk}>Medición guardada en el partido.</div>}
                <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proyección Táctica de Set</span>
                <h3 style={{ margin: '8px 0 16px 0', color: '#2b6cb0' }}>{resSet.diagnostico_momentum}</h3>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>
                    <span>Probabilidad Tenista: {resSet.probabilidad_ganar_set_p1}%</span>
                    <span>Rival: {resSet.probabilidad_ganar_set_p2}%</span>
                  </div>
                  <div style={{ width: '100%', background: '#edf2f7', height: '16px', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${resSet.probabilidad_ganar_set_p1}%`, background: '#38a169', transition: 'width 0.4s ease' }} />
                    <div style={{ width: `${resSet.probabilidad_ganar_set_p2}%`, background: '#e53e3e', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#4a5568', margin: '0 0 8px 0' }}>
                  <strong>Fiabilidad de la estimación:</strong> {resSet.nivel_confiabilidad}
                  {resSet.nivel_confiabilidad === 'Baja' && ' (se necesitan al menos 10 puntos jugados)'}
                </p>
                <p style={{ fontSize: '13px', color: '#718096', margin: 0 }}>
                  Modelo {resSet.modelo_version} entrenado con puntos de Grand Slam 2013 (US Open, Wimbledon y Roland Garros).
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '2px dashed #cbd5e0', borderRadius: '8px', color: '#a0aec0', padding: '40px', textAlign: 'center' }}>
                Ingrese los parciales del set para estimar la probabilidad probabilística de victoria.
              </div>
            )}
          </div>
        </div>
      )}

      {tabActiva === 'historial' && <Historial tenista={tenista} refresco={refresco} />}
    </div>
  );
}

export default Tablero;