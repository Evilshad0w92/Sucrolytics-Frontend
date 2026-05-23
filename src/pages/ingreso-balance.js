/**
 * ingreso-balance.js — Ingreso diario de datos del Balance de POL
 *
 * Campos del diagrama:
 *   Amarillo (usuario)  → inputs editables
 *   Blanco   (DB)       → read-only, viene de otra forma
 *   Calculado           → se recalcula automáticamente al escribir
 *
 * Secciones (mismo orden que el diagrama):
 *   ZAFRA             → CAÑA RECIBIDA DIA (TON)
 *   AGUA DE IMBIBICION → AGUA DE IMBIBICION DIA (TON)
 *   JUGO MEZCLADO     → JUGO MEZCLADO DIA (TONS) + SACAROSA APARENTE DIA [calc]
 *   ANALISIS          → BAGAZO SACAROSA (%) / MIEL FINAL SACAROSA /
 *                       FILTRO BANDA POL / JUGO MEZCLADO SACAROSA
 */

import { listarZafras, obtenerDia, guardarDia } from '../api/ingreso.js'
import { navegarA } from '../router.js'

// ─── Render principal ─────────────────────────────────────────────────────────

export async function renderIngresoBalance() {
  document.getElementById('app').innerHTML = `
    <div class="page-layout">
      <header class="page-header">
        <button class="btn-back" id="btn-back">← Dashboard</button>
        <h1 class="page-title">Ingreso Diario — Balance de POL</h1>
      </header>

      <main class="page-main ingreso-main">

        <!-- Selector de fecha y zafra -->
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
        </div>

        <div id="banner-estado" class="ingreso-banner" style="display:none"></div>

        <form id="form-balance" novalidate>
          <div class="ingreso-grid">

            <!-- ── ZAFRA ─────────────────────────────── -->
            <div class="ing-section">
              <div class="ing-section-title">ZAFRA</div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">CAÑA RECIBIDA DIA (TON)</label>
                <input class="form-input ing-input" type="number" step="0.001" id="cana_recibida_dia_ton" placeholder="0.000" />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-db">CAÑA MOLIDA BRUTA DIA (TONS)</label>
                <input class="form-input ing-input ing-readonly" type="number" id="cana_molida_bruta" placeholder="— ingresado en Molienda" readonly />
              </div>
            </div>

            <!-- ── AGUA DE IMBIBICION ─────────────────── -->
            <div class="ing-section">
              <div class="ing-section-title">AGUA DE IMBIBICION</div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">AGUA DE IMBIBICION DIA (TON)</label>
                <input class="form-input ing-input" type="number" step="0.001" id="agua_imbibicion_dia_ton" placeholder="0.000" />
              </div>
            </div>

            <!-- ── JUGO MEZCLADO ──────────────────────── -->
            <div class="ing-section">
              <div class="ing-section-title">JUGO MEZCLADO</div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">JUGO MEZCLADO DIA (TONS)</label>
                <input class="form-input ing-input" type="number" step="0.001" id="jugo_mezclado_dia_tons" placeholder="0.000" />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-calc">SACAROSA APARENTE DIA (TONS)</label>
                <input class="form-input ing-input ing-readonly" type="number" id="sacarosa_aparente_dia" placeholder="calculado" readonly />
              </div>
            </div>

            <!-- ── ANALISIS ───────────────────────────── -->
            <div class="ing-section">
              <div class="ing-section-title">ANALISIS</div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">BAGAZO SACAROSA (%)</label>
                <input class="form-input ing-input" type="number" step="0.0001" id="bagazo_sacarosa_pct" placeholder="0.0000" />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">MIEL FINAL SACAROSA</label>
                <input class="form-input ing-input" type="number" step="0.0001" id="miel_final_sacarosa" placeholder="0.0000" />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">FILTRO BANDA POL</label>
                <input class="form-input ing-input" type="number" step="0.0001" id="filtro_banda_pol" placeholder="0.0000" />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">JUGO MEZCLADO SACAROSA</label>
                <input class="form-input ing-input" type="number" step="0.0001" id="jugo_mezclado_sacarosa" placeholder="0.0000" />
              </div>
            </div>

          </div><!-- /ingreso-grid -->

          <div class="ingreso-footer">
            <button type="submit" class="btn-primary btn-guardar" id="btn-guardar">
              Guardar Datos
            </button>
          </div>
        </form>

      </main>
    </div>
  `

  document.getElementById('btn-back').addEventListener('click', () => navegarA('dashboard'))

  // Fecha → hoy por defecto
  const hoy = new Date().toISOString().slice(0, 10)
  document.getElementById('sel-fecha').value = hoy

  // Cargar zafras
  await cargarZafras()

  // Al cambiar fecha o zafra → cargar datos existentes
  document.getElementById('sel-fecha').addEventListener('change', cargarDiaActual)
  document.getElementById('sel-zafra').addEventListener('change', cargarDiaActual)

  // Recalcular SACAROSA APARENTE cuando cambian los dos inputs que la definen
  ;['jugo_mezclado_dia_tons', 'jugo_mezclado_sacarosa'].forEach(id =>
    document.getElementById(id).addEventListener('input', recalcularSacarosaAparente)
  )

  document.getElementById('form-balance').addEventListener('submit', guardar)

  // Carga inicial si ya hay zafra seleccionada
  cargarDiaActual()
}

// ─── Zafras ───────────────────────────────────────────────────────────────────

async function cargarZafras() {
  const sel = document.getElementById('sel-zafra')
  try {
    const zafras = await listarZafras() ?? []
    if (zafras.length === 0) {
      sel.innerHTML = '<option value="">Sin zafras registradas</option>'
      return
    }
    sel.innerHTML = zafras.map(z =>
      `<option value="${z.id}" ${z.is_active ? 'selected' : ''}>${z.name}${z.is_active ? ' (activa)' : ''}</option>`
    ).join('')
  } catch {
    sel.innerHTML = '<option value="">Error al cargar zafras</option>'
  }
}

// ─── Cargar datos existentes ──────────────────────────────────────────────────

async function cargarDiaActual() {
  const fecha   = document.getElementById('sel-fecha').value
  const zafraId = document.getElementById('sel-zafra').value
  if (!fecha || !zafraId) return

  try {
    const d = await obtenerDia(fecha, zafraId)
    if (!d) return

    // MOLIENDA
    setVal('cana_recibida_dia_ton',   d.molienda?.cana_recibida_tons)
    setVal('cana_molida_bruta',        d.molienda?.cana_molida_bruta_tons)
    setVal('agua_imbibicion_dia_ton',  d.molienda?.agua_imbibicion_tons)

    // JUGO MEZCLADO
    setVal('jugo_mezclado_dia_tons',   d.jugo_mezclado?.tons)
    setVal('jugo_mezclado_sacarosa',   d.jugo_mezclado?.sacarosa_pct)

    // ANALISIS
    setVal('bagazo_sacarosa_pct',      d.bagazo?.sacarosa_pct)
    setVal('miel_final_sacarosa',      d.miel_final?.sacarosa_pct)
    setVal('filtro_banda_pol',         d.cachaza?.sacarosa_pct)

    recalcularSacarosaAparente()
  } catch { /* sin datos para esta fecha, formulario vacío */ }
}

function setVal(id, val) {
  const el = document.getElementById(id)
  if (el && val != null) el.value = val
}

// ─── Cálculo en tiempo real ───────────────────────────────────────────────────

// SACAROSA APARENTE DIA (TONS) = ROUND(JUGO MEZCLADO DIA × JUGO MEZCLADO SACAROSA / 100, 3)
function recalcularSacarosaAparente() {
  const tons    = parseFloat(document.getElementById('jugo_mezclado_dia_tons').value)
  const sacarosa = parseFloat(document.getElementById('jugo_mezclado_sacarosa').value)
  const resultado = document.getElementById('sacarosa_aparente_dia')

  if (!isNaN(tons) && !isNaN(sacarosa)) {
    resultado.value = (Math.round(tons * sacarosa / 100 * 1000) / 1000).toFixed(3)
  } else {
    resultado.value = ''
  }
}

// ─── Guardar ──────────────────────────────────────────────────────────────────

async function guardar(e) {
  e.preventDefault()
  const banner  = document.getElementById('banner-estado')
  const btn     = document.getElementById('btn-guardar')
  const fecha   = document.getElementById('sel-fecha').value
  const zafraId = document.getElementById('sel-zafra').value

  if (!fecha || !zafraId) {
    mostrarBanner('Selecciona una fecha y una zafra antes de guardar.', 'error')
    return
  }

  btn.disabled = true
  btn.textContent = 'Guardando…'
  banner.style.display = 'none'

  const getNum = id => {
    const v = parseFloat(document.getElementById(id).value)
    return isNaN(v) ? null : v
  }

  try {
    await guardarDia({
      fecha,
      zafra_id:               zafraId,
      cana_recibida_dia_ton:  getNum('cana_recibida_dia_ton'),
      agua_imbibicion_dia_ton: getNum('agua_imbibicion_dia_ton'),
      jugo_mezclado_dia_tons: getNum('jugo_mezclado_dia_tons'),
      jugo_mezclado_sacarosa: getNum('jugo_mezclado_sacarosa'),
      bagazo_sacarosa_pct:    getNum('bagazo_sacarosa_pct'),
      miel_final_sacarosa:    getNum('miel_final_sacarosa'),
      filtro_banda_pol:       getNum('filtro_banda_pol'),
    })
    mostrarBanner('Datos guardados correctamente.', 'ok')
  } catch (err) {
    mostrarBanner(err.message, 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Guardar Datos'
  }
}

function mostrarBanner(msg, tipo) {
  const el = document.getElementById('banner-estado')
  el.textContent    = msg
  el.className      = `ingreso-banner ingreso-banner-${tipo}`
  el.style.display  = 'block'
}
