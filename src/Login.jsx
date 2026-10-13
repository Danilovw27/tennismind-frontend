import { useState } from 'react';
import { api, guardarToken, mensajeError } from './api';
import { boton, caja, cajaError, etiqueta } from './estilos';

export default function Login({ onLogin }) {
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      if (modo === 'registro') {
        await api.post('/api/auth/registro', { email, password, codigo_invitacion: codigo });
      }
      const form = new URLSearchParams({ username: email, password });
      const { data } = await api.post('/api/auth/login', form);
      guardarToken(data.access_token);
      const yo = await api.get('/api/auth/yo');
      onLogin(yo.data);
    } catch (err) {
      setError(mensajeError(err));
    }
    setCargando(false);
  };

  return (
    <div style={{ ...caja, maxWidth: '380px', margin: '40px auto' }}>
      <h3 style={{ marginTop: 0 }}>{modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta de entrenador'}</h3>
      <form onSubmit={enviar}>
        <label style={etiqueta} htmlFor="email">Correo</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
               style={{ width: '95%', padding: '8px', marginBottom: '12px' }} />

        <label style={etiqueta} htmlFor="password">Contraseña {modo === 'registro' && '(mínimo 10 caracteres)'}</label>
        <input id="password" type="password" required minLength={modo === 'registro' ? 10 : 1} value={password}
               onChange={(e) => setPassword(e.target.value)}
               style={{ width: '95%', padding: '8px', marginBottom: '12px' }} />

        {modo === 'registro' && (
          <>
            <label style={etiqueta} htmlFor="codigo">Código de invitación</label>
            <input id="codigo" type="password" required value={codigo} onChange={(e) => setCodigo(e.target.value)}
                   style={{ width: '95%', padding: '8px', marginBottom: '12px' }} />
          </>
        )}

        {error && <div role="alert" style={cajaError}>{error}</div>}

        <button type="submit" disabled={cargando} style={boton('#3182ce', cargando)}>
          {cargando ? 'Conectando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta y entrar'}
        </button>
      </form>
      <p style={{ fontSize: '12px', color: '#718096' }}>
        La primera conexión puede tardar hasta un minuto mientras despierta el servidor.
      </p>
      <button type="button" onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#2b6cb0', cursor: 'pointer', padding: 0 }}>
        {modo === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo cuenta'}
      </button>
    </div>
  );
}
