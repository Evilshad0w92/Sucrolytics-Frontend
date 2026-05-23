/**
 * users.js — Llamadas a la API de usuarios
 */

import { apiFetch } from './client.js'

export const listarUsuarios    = ()           => apiFetch('/api/users')
export const crearUsuario      = (body)       => apiFetch('/api/users',      { method: 'POST',   body: JSON.stringify(body) })
export const actualizarUsuario = (id, body)   => apiFetch(`/api/users/${id}`, { method: 'PUT',    body: JSON.stringify(body) })
export const eliminarUsuario   = (id)         => apiFetch(`/api/users/${id}`, { method: 'DELETE' })
export const cambiarPassword   = (body)       => apiFetch('/api/auth/me/password', { method: 'PUT', body: JSON.stringify(body) })
