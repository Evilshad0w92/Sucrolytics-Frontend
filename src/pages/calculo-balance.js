/**
 * calculo-balance.js — Cálculo del balance de POL
 *
 * Muestra el balance organizado en secciones (igual al diagrama del Excel):
 *   ZAFRA | AGUA DE IMBIBICION
 *   JUGO MEZCLADO | ANALISIS
 *   BAGAZO (salida calculada + acumulado FECHA)
 *
 * Los campos amarillos son editables y se guardan con el mismo endpoint de ingreso.
 * Los campos calculados/DB se actualizan en tiempo real o al cargar datos.
 */

import { listarZafras, guardarDia } from '../api/ingreso.js'
import { obtenerCalculo }           from '../api/calculo.js'
import { navegarA }                  from '../router.js'

// ─── Render principal ─────────────────────────────────────────────────────────

export async function renderCalculoBalance() {
  document.getElementById('app').innerHTML = `
    <div class="page-layout">
      <header class="page-header">
        <button class="btn-back" id="btn-back">← Dashboard</button>
        <h1 class="page-title">Cálculo — Balance de POL</h1>
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
                <input class="form-input ing-input ing-readonly" type="number" id="cana_molida_bruta" placeholder="— Molienda" readonly />
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
              <div class="ing-field">
                <label class="ing-label ing-db">SACAROSA APARENTE FECHA (TONS)</label>
                <input class="form-input ing-input ing-readonly" type="number" id="sacarosa_aparente_fecha" placeholder="acumulado" readonly />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-db">SACAROSA APARENTE DIA (%)</label>
                <input class="form-input ing-input ing-readonly" type="number" id="sacarosa_aparente_pct_display" placeholder="del análisis" readonly />
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

          <!-- ── BAGAZO (salida calculada) ─── -->
          <div class="ing-section bagazo-output" style="margin-top:20px">
            <div class="ing-section-title">BAGAZO</div>
            <div class="bagazo-grid">

              <div class="ing-field">
                <label class="ing-label ing-calc">BAGAZO DIA (TONS)</label>
                <input class="form-input ing-input ing-readonly" type="number" id="bagazo_dia_tons" placeholder="—" readonly />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-db">BAGAZO FECHA (TONS)</label>
                <input class="form-input ing-input ing-readonly" type="number" id="bagazo_fecha_tons" placeholder="—" readonly />
              </div>

              <div class="ing-field">
                <label class="ing-label ing-calc">SACAROSA APARENTE DIA (%)</label>
                <input class="form-input ing-input ing-readonly" type="number" id="sac_bagazo_dia_pct" placeholder="—" readonly />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-db">SACAROSA APARENTE FECHA (%)</label>
                <input class="form-input ing-input ing-readonly" type="number" id="sac_bagazo_fecha_pct" placeholder="—" readonly />
              </div>

              <div class="ing-field">
                <label class="ing-label ing-calc">SACAROSA APARENTE DIA (TON)</label>
                <input class="form-input ing-input ing-readonly" type="number" id="sac_bagazo_dia_ton" placeholder="—" readonly />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-db">SACAROSA APARENTE FECHA (TON)</label>
                <input class="form-input ing-input ing-readonly" type="number" id="sac_bagazo_fecha_ton" placeholder="—" readonly />
              </div>

            </div>
          </div>

          <div class="ingreso-footer">
            <button type="button" class="btn-secondary" id="btn-preview">Previsualizar</button>
            <button type="submit" class="btn-primary btn-guardar" id="btn-guardar">
              Guardar Datos
            </button>
          </div>
        </form>

      </main>
    </div>
  `

  document.getElementById('btn-back').addEventListener('click', () => navegarA('dashboard'))

  const hoy = new Date().toISOString().slice(0, 10)
  document.getElementById('sel-fecha').value = hoy

  await cargarZafras()

  document.getElementById('sel-fecha').addEventListener('change', cargarDatos)
  document.getElementById('sel-zafra').addEventListener('change', cargarDatos)

  ;['jugo_mezclado_dia_tons', 'jugo_mezclado_sacarosa'].forEach(id =>
    document.getElementById(id).addEventListener('input', recalcularJugo)
  )

  ;['bagazo_sacarosa_pct', 'jugo_mezclado_sacarosa'].forEach(id =>
    document.getElementById(id).addEventListener('input', reflejarAnalisis)
  )

  document.getElementById('btn-preview').addEventListener('click', previsualizarCalculo)
  document.getElementById('form-balance').addEventListener('submit', guardar)

  cargarDatos()
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

// ─── Cargar datos del día ─────────────────────────────────────────────────────

async function cargarDatos() {
  const fecha   = document.getElementById('sel-fecha').value
  const zafraId = document.getElementById('sel-zafra').value
  if (!fecha || !zafraId) return

  try {
    const d = await obtenerCalculo(fecha, zafraId)
    if (!d) return

    // ZAFRA / MOLIENDA
    setVal('cana_recibida_dia_ton',  d.molienda?.cana_recibida_tons)
    setVal('cana_molida_bruta',       d.molienda?.cana_molida_bruta_tons)
    setVal('agua_imbibicion_dia_ton', d.molienda?.agua_imbibicion_tons)

    // JUGO MEZCLADO
    setVal('jugo_mezclado_dia_tons',  d.jugo_mezclado?.tons)
    setVal('jugo_mezclado_sacarosa',  d.jugo_mezclado?.sacarosa_pct)

    // ANALISIS
    setVal('bagazo_sacarosa_pct',     d.bagazo?.sacarosa_pct)
    setVal('miel_final_sacarosa',     d.miel_final?.sacarosa_pct)
    setVal('filtro_banda_pol',        d.cachaza?.sacarosa_pct)

    // Acumulados desde API
    setVal('sacarosa_aparente_fecha', d.calculado?.sacarosa_aparente_fecha_tons)
    setVal('bagazo_dia_tons',         d.calculado?.bagazo_dia_tons)
    setVal('bagazo_fecha_tons',       d.calculado?.bagazo_fecha_tons)
    setVal('sac_bagazo_fecha_pct',    d.calculado?.sac_bagazo_pct_fecha)
    setVal('sac_bagazo_dia_ton',      d.calculado?.sac_bagazo_dia_tons)
    setVal('sac_bagazo_fecha_ton',    d.calculado?.sac_bagazo_fecha_tons)

    recalcularJugo()
    reflejarAnalisis()
  } catch { /* sin datos para esta fecha */ }
}

function setVal(id, val) {
  const el = document.getElementById(id)
  if (el && val != null) el.value = val
}

// ─── Cálculos en tiempo real ──────────────────────────────────────────────────

// SACAROSA APARENTE DIA (TONS) = ROUND(JM_TONS × JM_SAC% / 100, 3)
function recalcularJugo() {
  const tons     = parseFloat(document.getElementById('jugo_mezclado_dia_tons').value)
  const sacarosa = parseFloat(document.getElementById('jugo_mezclado_sacarosa').value)
  const el       = document.getElementById('sacarosa_aparente_dia')

  if (!isNaN(tons) && !isNaN(sacarosa)) {
    el.value = (Math.round(tons * sacarosa / 100 * 1000) / 1000).toFixed(3)
  } else {
    el.value = ''
  }
}

// Refleja los valores de ANALISIS en los campos readonly de JUGO MEZCLADO y BAGAZO
function reflejarAnalisis() {
  const jmSac = parseFloat(document.getElementById('jugo_mezclado_sacarosa').value)
  const bSac  = parseFloat(document.getElementById('bagazo_sacarosa_pct').value)

  const pctDisplay = document.getElementById('sacarosa_aparente_pct_display')
  pctDisplay.value = isNaN(jmSac) ? '' : jmSac

  const sacBazDia = document.getElementById('sac_bagazo_dia_pct')
  sacBazDia.value = isNaN(bSac) ? '' : bSac

  // SAC BAGAZO DIA (TON) = bagazo_dia_tons × bagazo_sacarosa_pct / 100
  const bazTons = parseFloat(document.getElementById('bagazo_dia_tons').value)
  const sacDiaTon = document.getElementById('sac_bagazo_dia_ton')
  if (!isNaN(bazTons) && !isNaN(bSac)) {
    sacDiaTon.value = (Math.round(bazTons * bSac / 100 * 10000) / 10000).toFixed(4)
  }
}

// ─── Preview ──────────────────────────────────────────────────────────────────

async function previsualizarCalculo() {
  const fecha   = document.getElementById('sel-fecha').value
  const zafraId = document.getElementById('sel-zafra').value
  if (!fecha || !zafraId) {
    mostrarBanner('Selecciona una fecha y una zafra para previsualizar.', 'error')
    return
  }

  const btn = document.getElementById('btn-preview')
  btn.disabled    = true
  btn.textContent = 'Calculando…'
  document.getElementById('banner-estado').style.display = 'none'

  // Cálculos client-side desde los inputs actuales
  recalcularJugo()
  reflejarAnalisis()

  try {
    const d = await obtenerCalculo(fecha, zafraId)
    if (d) {
      // Acumulados FECHA desde la API (basados en datos ya guardados)
      setVal('sacarosa_aparente_fecha', d.calculado?.sacarosa_aparente_fecha_tons)
      setVal('bagazo_dia_tons',         d.calculado?.bagazo_dia_tons)
      setVal('bagazo_fecha_tons',       d.calculado?.bagazo_fecha_tons)
      setVal('sac_bagazo_fecha_pct',    d.calculado?.sac_bagazo_pct_fecha)
      setVal('sac_bagazo_dia_ton',      d.calculado?.sac_bagazo_dia_tons)
      setVal('sac_bagazo_fecha_ton',    d.calculado?.sac_bagazo_fecha_tons)

      // Recalcular sac_bagazo_dia_ton localmente si hay bagazo_dia_tons disponible
      reflejarAnalisis()
    }
    mostrarBanner('Vista previa generada — los datos no han sido guardados aún.', 'info')
  } catch {
    mostrarBanner('No se pudieron obtener los valores acumulados.', 'error')
  } finally {
    btn.disabled    = false
    btn.textContent = 'Previsualizar'
  }
}

// ─── Guardar ──────────────────────────────────────────────────────────────────

async function guardar(e) {
  e.preventDefault()
  const btn     = document.getElementById('btn-guardar')
  const fecha   = document.getElementById('sel-fecha').value
  const zafraId = document.getElementById('sel-zafra').value

  if (!fecha || !zafraId) {
    mostrarBanner('Selecciona una fecha y una zafra antes de guardar.', 'error')
    return
  }

  btn.disabled    = true
  btn.textContent = 'Guardando…'
  document.getElementById('banner-estado').style.display = 'none'

  const getNum = id => {
    const v = parseFloat(document.getElementById(id).value)
    return isNaN(v) ? null : v
  }

  try {
    await guardarDia({
      fecha,
      zafra_id:                zafraId,
      cana_recibida_dia_ton:   getNum('cana_recibida_dia_ton'),
      agua_imbibicion_dia_ton: getNum('agua_imbibicion_dia_ton'),
      jugo_mezclado_dia_tons:  getNum('jugo_mezclado_dia_tons'),
      jugo_mezclado_sacarosa:  getNum('jugo_mezclado_sacarosa'),
      bagazo_sacarosa_pct:     getNum('bagazo_sacarosa_pct'),
      miel_final_sacarosa:     getNum('miel_final_sacarosa'),
      filtro_banda_pol:        getNum('filtro_banda_pol'),
    })
    mostrarBanner('Datos guardados correctamente.', 'ok')
    cargarDatos()
  } catch (err) {
    mostrarBanner(err.message, 'error')
  } finally {
    btn.disabled    = false
    btn.textContent = 'Guardar Datos'
  }
}

function mostrarBanner(msg, tipo) {
  const el = document.getElementById('banner-estado')
  el.textContent   = msg
  el.className     = `ingreso-banner ingreso-banner-${tipo}`
  el.style.display = 'block'
}
