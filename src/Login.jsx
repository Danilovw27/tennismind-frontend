import { useState } from 'react';
import { api, guardarToken, mensajeError } from './api';

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
    <div className="tarjeta login">
      <h2>{modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta de entrenador'}</h2>
      <p className="login-sub">
        {modo === 'login' ? 'Accede al panel de monitoreo de tus jugadores.' : 'Necesitas el código de invitación del equipo.'}
      </p>
      <form onSubmit={enviar}>
        <label htmlFor="email">Correo</label>
        <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">Contraseña {modo === 'registro' && '(mínimo 10 caracteres)'}</label>
        <input id="password" type="password" required minLength={modo === 'registro' ? 10 : 1}
               autoComplete={modo === 'registro' ? 'new-password' : 'current-password'}
               value={password} onChange={(e) => setPassword(e.target.value)} />

        {modo === 'registro' && (
          <>
            <label htmlFor="codigo">Código de invitación</label>
            <input id="codigo" type="password" required value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </>
        )}

        {error && <div role="alert" className="msg msg-error">{error}</div>}

        <button type="submit" disabled={cargando} className="btn btn-bloque">
          {cargando ? 'Conectando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta y entrar'}
        </button>
      </form>
      <p style={{ fontSize: '0.8rem', color: 'var(--texto-2)', margin: '12px 0 0' }}>
        La primera conexión puede tardar hasta un minuto mientras despierta el servidor.
      </p>
      <button type="button" className="enlace" onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError(''); }}>
        {modo === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo cuenta'}
      </button>
    </div>
  );
}
