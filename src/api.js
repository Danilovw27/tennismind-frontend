import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://tennismind-backend-tc3o.onrender.com';

const CLAVE = 'tennismind_token';

// La sesión vive en sessionStorage: se borra al cerrar la pestaña.
export const leerToken = () => {
  try { return sessionStorage.getItem(CLAVE); } catch { return null; }
};
export const guardarToken = (token) => {
  try {
    if (token) sessionStorage.setItem(CLAVE, token);
    else sessionStorage.removeItem(CLAVE);
  } catch { /* sin almacenamiento disponible */ }
};

// Timeout alto: el servidor gratuito de Render puede tardar ~1 min en despertar
export const api = axios.create({ baseURL: API_BASE_URL, timeout: 90000 });

api.interceptors.request.use((config) => {
  const token = leerToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let alExpirarSesion = () => {};
export const registrarAlExpirar = (fn) => { alExpirarSesion = fn; };

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/login')) alExpirarSesion();
    return Promise.reject(error);
  },
);

export function mensajeError(error) {
  const detalle = error.response?.data?.detail;
  if (typeof detalle === 'string') return detalle;
  if (Array.isArray(detalle)) {
    return detalle.map((d) => (d.msg || '').replace(/^Value error, /, '')).join('; ');
  }
  if (error.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder. Reintenta en unos segundos.';
  if (!error.response) return 'No se pudo conectar con el servidor.';
  return 'Ocurrió un error inesperado.';
}
