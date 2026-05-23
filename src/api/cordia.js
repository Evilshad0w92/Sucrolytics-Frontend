import { apiFetch } from './client.js'

export const obtenerCordia = (fecha, zafraId) =>
  apiFetch(`/api/cordia/dia?fecha=${fecha}&zafra_id=${zafraId}`)

export const obtenerUltimoDia = (zafraId) =>
  apiFetch(`/api/cordia/ultimo-dia?zafra_id=${zafraId}`)
