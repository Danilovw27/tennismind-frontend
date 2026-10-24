import { useCallback, useEffect, useState } from 'react';
import { api, guardarToken, leerToken, registrarAlExpirar } from './api';
import Login from './Login';
import PanelJugadores from './PanelJugadores';
import Tablero from './Tablero';
import { LogoTennisMind } from './iconos';
import './tennismind.css';

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
    <>
      <header className="cabecera">
        <div className="cabecera-interior">
          <div className="marca">
            <LogoTennisMind />
            <div>
              <h1 className="marca-nombre">TennisMind</h1>
              <p className="marca-lema">Monitoreo psicológico y predicción táctica</p>
            </div>
          </div>
          {usuario && (
            <div className="usuario">
              <span className="usuario-correo" title={usuario.email}>{usuario.email}</span>
              <button type="button" className="btn-salir" onClick={cerrarSesion}>Salir</button>
            </div>
          )}
        </div>
      </header>

      <main className="app">
        <div className="aviso-proto">
          Prototipo: el modelo psicológico fue entrenado con datos sintéticos y no constituye un diagnóstico.
        </div>

        {verificando ? (
          <p style={{ textAlign: 'center' }} role="status">Verificando sesión...</p>
        ) : !usuario ? (
          <Login onLogin={setUsuario} />
        ) : (
          <>
            <PanelJugadores seleccionado={tenista} onSeleccionar={seleccionar} />
            <Tablero tenista={tenista} />
          </>
        )}
      </main>
    </>
  );
}

export default App;
