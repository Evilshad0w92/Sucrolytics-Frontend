/**
 * ingreso.js — Llamadas a la API de ingreso diario de balance
 */

import { apiFetch } from './client.js'

export const listarZafras = () =>
  apiFetch('/api/ingreso/zafras')

export const obtenerDia = (fecha, zafraId) =>
  apiFetch(`/api/ingreso/dia?fecha=${fecha}&zafra_id=${zafraId}`)

export const guardarDia = (body) =>
  apiFetch('/api/ingreso/dia', { method: 'POST', body: JSON.stringify(body) })

export const guardarInicial = (body) =>
  apiFetch('/api/ingreso/inicial', { method: 'POST', body: JSON.stringify(body) })

export const obtenerInicial = (zafraId) =>
  apiFetch(`/api/ingreso/inicial?zafra_id=${zafraId}`)
