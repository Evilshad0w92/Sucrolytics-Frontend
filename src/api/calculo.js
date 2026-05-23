import { apiFetch } from './client.js'

export const obtenerCalculo = (fecha, zafraId) =>
  apiFetch(`/api/calculo/dia?fecha=${fecha}&zafra_id=${zafraId}`)
