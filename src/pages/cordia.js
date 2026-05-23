/**
 * cordia.js — Corrida Diaria: pérdidas y balance de POL (vista de resultados)
 *
 * Columnas N y O del Excel CORdia 1:
 *   N = DIA   (valor del día seleccionado)
 *   O = FECHA (acumulado desde inicio de zafra)
 */

import { listarZafras }                    from '../api/ingreso.js'
import { obtenerCordia, obtenerUltimoDia } from '../api/cordia.js'
import { navegarA }      from '../router.js'

const FILAS = [
  { key: 'perdida_bagazo',    label: 'PERDIDA BAGAZO' },
  { key: 'perdida_miel',      label: 'PERDIDA MIEL FINAL P Y E' },
  { key: 'perdida_cachaza',   label: 'PERDIDA CACHAZA' },
  { key: 'perdida_indet',     label: 'PERDIDA INDETERMINADA' },
  { key: 'perdidas_totales',  label: 'PERDIDAS TOTALES', separador: true },
  { key: 'azucar_pye',        label: 'AZÚCAR P Y E' },
  { key: 'pol_en_cana',       label: 'POL EN CAÑA' },
]

export async function renderCordia() {
  document.getElementById('app').innerHTML = `
    <div class="page-layout">
      <header class="page-header">
        <button class="btn-back" id="btn-back">← Dashboard</button>
        <h1 class="page-title">Corrida Diaria — Balance de POL</h1>
      </header>

      <main class="page-main" style="max-width:1040px">

        <div class="ingreso-controles">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input class="form-input" type="date" id="sel-fecha" />
          </div>
          <div class="form-group">
            <label class="form-label">Zafra</label>
            <select class="form-input" id="sel-zafra">
              <option value="">Cargando zafras…</option>
            </select>
          </div>
          <div class="form-group" style="align-self:flex-end;display:flex;gap:8px">
            <button class="btn-secondary" id="btn-ultimo-dia" style="padding:10px 16px">Último día</button>
            <button class="btn-primary"   id="btn-calcular"   style="padding:10px 24px">Calcular</button>
          </div>
        </div>

        <div id="cordia-resultado"></div>

      </main>
    </div>
  `

  document.getElementById('btn-back').addEventListener('click', () => navegarA('dashboard'))
  document.getElementById('btn-calcular').addEventListener('click', calcular)
  document.getElementById('btn-ultimo-dia').addEventListener('click', irUltimoDia)

  const hoy = new Date().toISOString().slice(0, 10)
  document.getElementById('sel-fecha').value = hoy

  await cargarZafras()
  await irUltimoDia()   // arranca en el último día con datos
}

async function cargarZafras() {
  const sel = document.getElementById('sel-zafra')
  try {
    const zafras = await listarZafras() ?? []
    if (!zafras.length) { sel.innerHTML = '<option value="">Sin zafras</option>'; return }
    sel.innerHTML = zafras.map(z =>
      `<option value="${z.id}" ${z.is_active ? 'selected' : ''}>${z.name}${z.is_active ? ' (activa)' : ''}</option>`
    ).join('')
  } catch {
    sel.innerHTML = '<option value="">Error al cargar</option>'
  }
}

async function irUltimoDia() {
  const zafraId = document.getElementById('sel-zafra').value
  if (!zafraId) return
  try {
    const r = await obtenerUltimoDia(zafraId)
    if (r?.fecha) document.getElementById('sel-fecha').value = r.fecha
  } catch { /* sin datos, deja la fecha actual */ }
  calcular()
}

async function calcular() {
  const fecha   = document.getElementById('sel-fecha').value
  const zafraId = document.getElementById('sel-zafra').value
  const cont    = document.getElementById('cordia-resultado')

  if (!fecha || !zafraId) { cont.innerHTML = ''; return }

  cont.innerHTML = '<p style="color:var(--gris);margin-top:20px">Calculando…</p>'

  try {
    const d = await obtenerCordia(fecha, zafraId)
    cont.innerHTML = renderTabla(d, fecha)
  } catch (err) {
    cont.innerHTML = `<p style="color:var(--rojo);margin-top:16px">${err.message}</p>`
  }
}

function round3(v) {
  return Math.round(v * 1000) / 1000
}

function fmt3(v) {
  if (v == null) return dash()
  return Number(v).toLocaleString('es-MX', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

function fmt(v) {
  if (v == null) return dash()
  return Number(v).toLocaleString('es-MX', { minimumFractionDigits: 3, maximumFractionDigits: 4 })
}

function dash() {
  return '<span style="color:#d1d5db">—</span>'
}

function card(titulo, contenido, accent = '#6b7280') {
  return `
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:3px solid ${accent};
                border-radius:12px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <div style="font-size:.67rem;font-weight:700;text-transform:uppercase;letter-spacing:.7px;
                  color:${accent};margin-bottom:12px">${titulo}</div>
      ${contenido}
    </div>`
}

function tabla(filas, conFecha = true) {
  const colFecha = conFecha
    ? `<th style="text-align:right;padding-bottom:7px;font-size:11px;font-weight:600;
                  text-transform:uppercase;letter-spacing:.4px;color:#065f46">FECHA</th>`
    : ''
  return `
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="border-bottom:1px solid #f3f4f6">
          <th style="text-align:left;padding-bottom:7px;font-size:11px;font-weight:600;
                     text-transform:uppercase;letter-spacing:.4px;color:#9ca3af"></th>
          <th style="text-align:right;padding-bottom:7px;font-size:11px;font-weight:600;
                     text-transform:uppercase;letter-spacing:.4px;color:#1e40af">DIA</th>
          ${colFecha}
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>`
}

function fila(label, dia, fecha = null, bold = false, sep = false) {
  const sepStyle = sep ? 'border-top:2px solid #e5e7eb;' : ''
  const txtStyle = bold ? 'font-weight:700;color:#111827' : 'color:#374151'
  const numStyle = bold ? 'font-weight:700;color:#111827' : 'color:#1f2937'
  const f = fecha !== null
    ? `<td style="text-align:right;padding:5px 0;font-size:12.5px;font-variant-numeric:tabular-nums;${numStyle}">${fecha}</td>`
    : ''
  return `
    <tr style="${sepStyle}border-bottom:1px solid #f9fafb">
      <td style="padding:5px 0;font-size:12.5px;${txtStyle}">${label}</td>
      <td style="text-align:right;padding:5px 0;font-size:12.5px;font-variant-numeric:tabular-nums;${numStyle}">${dia}</td>
      ${f}
    </tr>`
}

function renderTabla(d, fecha) {

  // ── Balance de POL (full width) ────────────────────────────────────────────
  const i3js = v => (v != null ? Math.round(v * 1000) : null)
  const totDia = (i3js(d.pol_en_cana_dia) != null && i3js(d.azucar_pye_dia) != null)
    ? (i3js(d.pol_en_cana_dia) - i3js(d.azucar_pye_dia)) / 1000 : null
  const totFecha = (i3js(d.pol_en_cana_fecha) != null && i3js(d.az_sac_fecha_pe) != null)
    ? (i3js(d.pol_en_cana_fecha) - i3js(d.az_sac_fecha_pe)) / 1000 : null

  const filasBalance =
    fila('Pérdida Bagazo',           fmt3(d.perdida_bagazo_dia),         fmt3(d.perdida_bagazo_fecha)) +
    fila('Pérdida Miel Final P Y E', fmt3(d.perdida_miel_dia),           fmt3(d.mf_sac_fecha_pe)) +
    fila('Pérdida Cachaza',          fmt3(d.perdida_indet_dia_pe),       fmt3(d.perdida_indet_fecha_pe)) +
    fila('Pérdida Indeterminada',    fmt(d.perdida_indet_dia),           fmt(d.perdida_indet_fecha)) +
    fila('Pérdidas Totales',         fmt3(totDia),                       fmt3(totFecha),         true, true) +
    fila('Azúcar P Y E',            fmt3(d.azucar_pye_dia),             fmt3(d.az_sac_fecha_pe)) +
    fila('POL en Caña',             fmt3(d.pol_en_cana_dia),            fmt3(d.pol_en_cana_fecha), true)

  const balanceCard = card('Balance de POL', tabla(filasBalance), '#dc2626')

  // ── JM ───────────────────────────────────────────────────────────────────
  const jmCard = card('Jugo Mezclado', tabla(
    fila('Toneladas (TONS)',       fmt(d.jm_tons_dia),     null) +
    fila('Sacarosa Aparente (%)',  fmt(d.jm_sac_pct_dia),  null) +
    fila('Sacarosa Aparente (TONS)', fmt(d.jm_sac_dia),   fmt(d.jm_sac_fecha))
  ), '#1e40af')

  // ── Bagazo ────────────────────────────────────────────────────────────────
  const bagazoCard = card('Bagazo', tabla(
    fila('Bagazo (TONS)',           fmt3(d.baz_tons_dia),       fmt3(d.baz_tons_fecha)) +
    fila('Sacarosa Aparente (%)',   fmt(d.baz_sac_pct_dia),     fmt(d.baz_sac_pct_fecha)) +
    fila('Sacarosa Aparente (TONS)', fmt(d.perdida_bagazo_dia), fmt(d.perdida_bagazo_fecha))
  ), '#7c3aed')

  // ── Miel Final ───────────────────────────────────────────────────────────
  const mielCard = card('Miel Final', tabla(
    fila('Sacarosa Aparente (%)',     fmt(d.mf_sac_pct_dia),  null) +
    fila('Miel Final Física (TONS)',  fmt(d.mf_fisica_dia),   null) +
    fila('Sacarosa Aparente (TONS)',  fmt(d.mf_sac_dia),      fmt(d.mf_sac_fecha))
  ), '#d97706')

  // ── Cachaza ───────────────────────────────────────────────────────────────
  const cachazaCard = card('Cachaza', tabla(
    fila('Cachaza (TON)',             fmt(d.cach_tons_dia),     null) +
    fila('Sacarosa Aparente (%)',     fmt(d.cach_sac_pct_dia),  null) +
    fila('Sacarosa Aparente (TONS)',  fmt(d.cach_sac_dia),      fmt(d.cach_sac_fecha))
  ), '#64748b')

  // ── Proceso ───────────────────────────────────────────────────────────────
  const procesoCard = card('Proceso', tabla(
    fila('Sacarosa a Miel Final (TONS)', fmt3(d.mf_stock_dia), fmt3(d.mf_stock_fecha)) +
    fila('Sacarosa Recuperable (TONS)',  fmt3(d.sr_stock_dia),  fmt3(d.sr_stock_fecha))
  ), '#0891b2')

  // ── Producido (SAC aparente) ──────────────────────────────────────────────
  const producidoCard = card('Producido — Sacarosa Aparente', tabla(
    fila('Bagazo (TONS)',        fmt3(d.perdida_bagazo_dia), fmt3(d.perdida_bagazo_fecha)) +
    fila('Miel Final (TONS)',    fmt3(d.mf_sac_dia),         fmt3(d.mf_sac_fecha)) +
    fila('Cachaza (TONS)',       fmt3(d.cach_sac_dia),        fmt3(d.cach_sac_fecha)) +
    fila('Jugo Mezclado (TONS)', fmt3(d.jm_sac_dia),          fmt3(d.jm_sac_fecha)) +
    fila('Azúcar (TONS)',        fmt3(d.az_sac_dia),           fmt3(d.az_sac_fecha), true, true)
  ), '#059669')

  // ── Caña ──────────────────────────────────────────────────────────────────
  const canaCard = card(
    'Caña',
    tabla(fila('Sacarosa Aparente (TONS)', fmt3(d.pol_en_cana_dia), fmt3(d.pol_en_cana_fecha)), true),
    '#065f46'
  )

  // ── Azúcar Total ──────────────────────────────────────────────────────────
  const azTotalCard = card('Azúcar Total — Sacarosa Aparente', tabla(
    fila('Sacarosa Aparente (TONS)', fmt(d.az_sac_dia), fmt(d.az_sac_fecha), true)
  ), '#15803d')

  // ── Azúcar por tipo ──────────────────────────────────────────────────────
  const tipos = [
    { label: 'Refinado',  tons: d.ref_tons_dia, pol: d.ref_pol_pct_dia, sac: d.ref_sac_dia },
    { label: 'Estándar',  tons: d.est_tons_dia, pol: d.est_pol_pct_dia, sac: d.est_sac_dia },
    { label: 'Crudo',     tons: d.cru_tons_dia, pol: d.cru_pol_pct_dia, sac: d.cru_sac_dia },
  ]
  const tiposBloques = tipos.map(t => `
    <div style="flex:1;min-width:180px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
                  color:#15803d;padding-bottom:6px;margin-bottom:8px;border-bottom:1px solid #f3f4f6">
        ${t.label}
      </div>
      ${tabla(
        fila('SAC. Aparente (TONS)', fmt3(t.sac),  null) +
        fila('SAC. Aparente (%)',    fmt(t.pol),   null) +
        fila('Azúcar (TONS)',        fmt(t.tons),  null),
        false
      )}
    </div>`).join('')

  const azucarCard = card('Producción — Azúcar',
    `<div style="display:flex;gap:24px;flex-wrap:wrap">${tiposBloques}</div>`,
    '#15803d'
  )

  // ── Producido y Estimado (SAC aparente) ──────────────────────────────────
  const prodEstCard = card('Producido y Estimado', tabla(
    fila('Bagazo (TONS)',         fmt3(d.perdida_bagazo_dia),      fmt3(d.perdida_bagazo_fecha)) +
    fila('Miel Final (TONS)',     fmt3(d.perdida_miel_dia),        fmt3(d.mf_sac_fecha_pe)) +
    fila('Cachaza (TONS)',        fmt3(d.perdida_cachaza_dia),     fmt3(d.cach_sac_fecha)) +
    fila('Indeterminados (TONS)', fmt3(d.perdida_indet_dia_pe),   fmt3(d.perdida_indet_fecha_pe)) +
    fila('Caña (TONS)',           fmt3(d.pol_en_cana_dia),         fmt3(d.pol_en_cana_fecha), false, true) +
    fila('Azúcar (TONS)',         fmt3(d.azucar_pye_dia),          fmt3(d.az_sac_fecha_pe)) +
    fila('Jugo Mezclado (TONS)',  fmt3(d.jm_sac_dia),              fmt3(d.jm_sac_fecha))
  ), '#6b7280')

  // ── Layout ────────────────────────────────────────────────────────────────
  const grid2 = (...cards) =>
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">${cards.join('')}</div>`

  return `
    <div style="margin-top:24px;display:flex;flex-direction:column;gap:16px">
      ${balanceCard}
      ${canaCard}
      ${grid2(jmCard, bagazoCard)}
      ${grid2(mielCard, cachazaCard)}
      ${grid2(procesoCard, producidoCard)}
      ${azTotalCard}
      ${azucarCard}
      ${prodEstCard}
    </div>
  `
}
