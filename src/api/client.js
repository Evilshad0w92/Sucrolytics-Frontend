/**
 * client.js — Cliente HTTP autenticado
 *
 * Adjunta el token JWT a cada petición.
 * Si el token expira (401) cierra la sesión automáticamente.
 */

import { getToken, cerrarSesion } from '../router.js'

// Local development
// export const BASE_URL = 'http://localhost:8000'

// Production — Render
export const BASE_URL = 'https://sucrolytics-backend.onrender.com'

export async function apiFetch(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...options.headers,
    },
  })

  if (res.status === 401) { cerrarSesion(); return null }
  if (res.status === 204) return null  // DELETE exitoso, sin cuerpo

  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || `Error ${res.status}`)
  return data
}
