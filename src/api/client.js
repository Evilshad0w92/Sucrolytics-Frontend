/**
 * client.js — Cliente HTTP autenticado
 *
 * Adjunta el token JWT a cada petición.
 * Si el token expira (401) cierra la sesión automáticamente.
 */

import { getToken, cerrarSesion } from '../router.js'

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
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
