import { useCallback, useEffect, useState } from 'react';
import { api, guardarToken, leerToken, registrarAlExpirar } from './api';
import Login from './Login';
import PanelJugadores from './PanelJugadores';
import Tablero from './Tablero';
import { botonSecundario } from './estilos';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(Boolean(leerToken()));
  const [tenista, setTenista] = useState(null);
  const seleccionar = useCallback((t) => setTenista(t), []);

  const cerrarSesion = useCallback(() => {
    guardarToken(null); setUsuario(null); setTenista(null);
  }, []);

  useEffect(() => { registrarAlExpirar(cerrarSesion); }, [cerrarSesion]);

  // Si hay un token guardado en la pestaña, se valida al cargar
  useEffect(() => {
    if (!leerToken()) return;
    api.get('/api/auth/yo')
      .then(({ data }) => setUsuario(data))
      .catch(() => guardarToken(null))
      .finally(() => setVerificando(false));
  }, []);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, color: '#1a365d' }}>TennisMind Coach Dashboard</h1>
        <p style={{ color: '#4a5568', margin: '4px 0 0 0' }}>Sistema de Monitoreo Psicológico y Predicción Táctica</p>
      </header>

      <div style={{ background: '#fffaf0', border: '1px solid #fbd38d', color: '#744210', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>
        Prototipo: el modelo psicológico fue entrenado con datos sintéticos y no constituye un diagnóstico.
      </div>

      {verificando ? (
        <p style={{ textAlign: 'center' }}>Verificando sesión...</p>
      ) : !usuario ? (
        <Login onLogin={setUsuario} />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '14px', color: '#4a5568' }}>
            <span>Sesión: <strong>{usuario.email}</strong></span>
            <button type="button" onClick={cerrarSesion} style={botonSecundario()}>Cerrar sesión</button>
          </div>
          <PanelJugadores seleccionado={tenista} onSeleccionar={seleccionar} />
          <Tablero tenista={tenista} />
        </>
      )}
    </div>
  );
}

export default App;
