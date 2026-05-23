/**
 * ingreso-datos.js — Ingreso de todos los campos amarillos del Balance de POL
 *
 * Secciones (siguiendo el diagrama):
 *   ZAFRA | AGUA DE IMBIBICION
 *   JUGO MEZCLADO | ANALISIS
 *   PROCESO (MIEL FINAL) | CACHAZA
 *   PRODUCCION (REFINADO / ESTANDAR / CRUDO)
 */

import { listarZafras, obtenerDia, guardarDia, guardarInicial, obtenerInicial } from '../api/ingreso.js'
import { navegarA } from '../router.js'

export async function renderIngresoDatos() {
  document.getElementById('app').innerHTML = `
    <div class="page-layout">
      <header class="page-header">
        <button class="btn-back" id="btn-back">← Dashboard</button>
        <h1 class="page-title">Ingreso de Datos — Balance de POL</h1>
      </header>

      <main class="page-main ingreso-main">

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
        <div id="banner-inicial" class="ingreso-banner" style="display:none"></div>

        <!-- ── Carga Inicial (columna I del Excel — FECHA día anterior) ── -->
        <div class="ing-section" style="margin-bottom:20px;background:var(--azul-claro,#e8f0fe);border-color:var(--azul,#1a56db)">
          <div class="ing-section-title" style="color:var(--azul,#1a56db)">CARGA INICIAL</div>
          <div class="ingreso-grid">
            <div class="ing-field">
              <label class="ing-label ing-amarillo">JUGO MEZCLADO SAC. APARENTE FECHA ANTERIOR (TONS)</label>
              <input class="form-input ing-input" type="text" id="inicial-jm-sac" placeholder="0.000" />
            </div>
            <div class="ing-field">
              <label class="ing-label ing-amarillo">MIEL FINAL SAC. APARENTE FECHA ANTERIOR (TONS)</label>
              <input class="form-input ing-input" type="text" id="inicial-miel-sac" placeholder="0.000" />
            </div>
            <div class="ing-field">
              <label class="ing-label ing-amarillo">CACHAZA SAC. APARENTE FECHA ANTERIOR (TONS)</label>
              <input class="form-input ing-input" type="text" id="inicial-cachaza-sac" placeholder="0.000" />
            </div>
            <div class="ing-field">
              <label class="ing-label ing-amarillo">AZÚCAR TOTAL SAC. APARENTE FECHA ANTERIOR (TONS)</label>
              <input class="form-input ing-input" type="text" id="inicial-azucar-sac" placeholder="0.000" />
            </div>
            <div class="ing-field">
              <label class="ing-label ing-amarillo">BAGAZO SAC. APARENTE FECHA ANTERIOR (TONS)</label>
              <input class="form-input ing-input" type="text" id="inicial-bagazo-sac" placeholder="0.000" />
            </div>
            <div class="ing-field">
              <label class="ing-label ing-amarillo">CAÑA MOLIDA BRUTA FECHA ANTERIOR (TONS)</label>
              <input class="form-input ing-input" type="text" id="inicial-cana-fecha" placeholder="0.000" />
            </div>
            <div class="ing-field">
              <label class="ing-label ing-amarillo">AGUA DE IMBIBICIÓN FECHA ANTERIOR (TONS)</label>
              <input class="form-input ing-input" type="text" id="inicial-agua-fecha" placeholder="0.000" />
            </div>
            <div class="ing-field">
              <label class="ing-label ing-amarillo">JUGO MEZCLADO TONS FECHA ANTERIOR (TONS)</label>
              <input class="form-input ing-input" type="text" id="inicial-jm-tons-fecha" placeholder="0.000" />
            </div>
            <div class="ing-field">
              <label class="ing-label ing-amarillo">SAC. A MIEL FINAL — STOCK DÍA ANTERIOR (TONS)</label>
              <input class="form-input ing-input" type="text" id="inicial-tons-fisica" placeholder="0.000" />
            </div>
            <div class="ing-field">
              <label class="ing-label ing-amarillo">SAC. RECUPERABLE — STOCK DÍA ANTERIOR (TONS)</label>
              <input class="form-input ing-input" type="text" id="inicial-sac-rec" placeholder="0.000" />
            </div>
          </div>
          <button type="button" class="btn-primary" id="btn-guardar-inicial" style="margin-top:12px;padding:8px 20px">
            Guardar Carga Inicial
          </button>
        </div>

        <form id="form-ingreso" novalidate>

          <!-- ── Fila 1: ZAFRA + AGUA ───────────────────────────── -->
          <div class="ingreso-grid">

            <div class="ing-section">
              <div class="ing-section-title">ZAFRA</div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">CAÑA RECIBIDA DIA (TON)</label>
                <input class="form-input ing-input" type="text" id="cana_recibida_dia_ton" placeholder="0.000" />
              </div>
            </div>

            <div class="ing-section">
              <div class="ing-section-title">AGUA DE IMBIBICION</div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">AGUA DE IMBIBICION DIA (TON)</label>
                <input class="form-input ing-input" type="text" id="agua_imbibicion_dia_ton" placeholder="0.000" />
              </div>
            </div>

          </div>

          <!-- ── Fila 2: JUGO MEZCLADO + ANALISIS ──────────────── -->
          <div class="ingreso-grid" style="margin-top:20px">

            <div class="ing-section">
              <div class="ing-section-title">JUGO MEZCLADO</div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">JUGO MEZCLADO DIA (TONS)</label>
                <input class="form-input ing-input" type="text" id="jugo_mezclado_dia_tons" placeholder="0.000" />
              </div>
            </div>

            <div class="ing-section">
              <div class="ing-section-title">ANALISIS</div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">BAGAZO SACAROSA (%)</label>
                <input class="form-input ing-input" type="text" id="bagazo_sacarosa_pct" placeholder="0.0000" />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">MIEL FINAL SACAROSA (%)</label>
                <input class="form-input ing-input" type="text" id="miel_final_sacarosa" placeholder="0.0000" />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">FILTRO BANDA POL (%)</label>
                <input class="form-input ing-input" type="text" id="filtro_banda_pol" placeholder="0.0000" />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">JUGO MEZCLADO SACAROSA (%)</label>
                <input class="form-input ing-input" type="text" id="jugo_mezclado_sacarosa" placeholder="0.0000" />
              </div>
            </div>

          </div>

          <!-- ── Fila 3: MIEL FINAL + PROCESO + CACHAZA ──────── -->
          <div class="ingreso-grid" style="margin-top:20px">

            <div class="ing-section">
              <div class="ing-section-title">MIEL FINAL</div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">MIEL FINAL FISICA — TONS DIA</label>
                <input class="form-input ing-input" type="text" id="sacarosa_a_miel_final_tons" placeholder="0.000" />
              </div>
            </div>

            <div class="ing-section">
              <div class="ing-section-title">PROCESO</div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">SACAROSA A MIEL FINAL FECHA (TONS)</label>
                <input class="form-input ing-input" type="text" id="miel_final_fisica_tons" placeholder="0.000" />
              </div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">SACAROSA RECUPERABLE FECHA (TONS)</label>
                <input class="form-input ing-input" type="text" id="sacarosa_recuperable_tons" placeholder="0.000" />
              </div>
            </div>

            <div class="ing-section">
              <div class="ing-section-title">CACHAZA</div>
              <div class="ing-field">
                <label class="ing-label ing-amarillo">CACHAZA DIA (TON)</label>
                <input class="form-input ing-input" type="text" id="cachaza_dia_tons" placeholder="0.000" />
              </div>
            </div>

          </div>

          <!-- ── Fila 4: PRODUCCION (3 columnas) ─────────────── -->
          <div class="ing-section azucar-section" style="margin-top:20px">
            <div class="ing-section-title">PRODUCCION — AZUCAR</div>
            <div class="azucar-grid">

              <div>
                <div class="azucar-tipo-titulo">REFINADO</div>
                <div class="ing-field">
                  <label class="ing-label ing-amarillo">AZUCAR REFINADO DIA (TONS)</label>
                  <input class="form-input ing-input" type="text" id="refinado_tons" placeholder="0.000" />
                </div>
                <div class="ing-field">
                  <label class="ing-label ing-amarillo">SACAROSA APARENTE DIA (%)</label>
                  <input class="form-input ing-input" type="text" id="refinado_pol_pct" placeholder="0.0000" />
                </div>
              </div>

              <div>
                <div class="azucar-tipo-titulo">ESTÁNDAR</div>
                <div class="ing-field">
                  <label class="ing-label ing-amarillo">AZUCAR ESTANDAR DIA (TONS)</label>
                  <input class="form-input ing-input" type="text" id="estandar_tons" placeholder="0.000" />
                </div>
                <div class="ing-field">
                  <label class="ing-label ing-amarillo">SACAROSA APARENTE DIA (%)</label>
                  <input class="form-input ing-input" type="text" id="estandar_pol_pct" placeholder="0.0000" />
                </div>
              </div>

              <div>
                <div class="azucar-tipo-titulo">CRUDO</div>
                <div class="ing-field">
                  <label class="ing-label ing-amarillo">AZUCAR CRUDO DIA (TONS)</label>
                  <input class="form-input ing-input" type="text" id="crudo_tons" placeholder="0.000" />
                </div>
                <div class="ing-field">
                  <label class="ing-label ing-amarillo">SACAROSA APARENTE DIA (%)</label>
                  <input class="form-input ing-input" type="text" id="crudo_pol_pct" placeholder="0.0000" />
                </div>
              </div>

            </div>
          </div>

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

  const hoy = new Date().toISOString().slice(0, 10)
  document.getElementById('sel-fecha').value = hoy

  await cargarZafras()

  document.getElementById('sel-fecha').addEventListener('change', cargarDatos)
  document.getElementById('sel-zafra').addEventListener('change', () => { cargarDatos(); cargarInicial() })
  document.getElementById('form-ingreso').addEventListener('submit', guardar)
  document.getElementById('btn-guardar-inicial').addEventListener('click', guardarInicialFn)

  cargarDatos()
  cargarInicial()
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

// ─── Carga Inicial ────────────────────────────────────────────────────────────

function parseNum(raw) {
  if (raw == null) return null
  const v = parseFloat(String(raw).trim().replace(',', '.'))
  return isNaN(v) ? null : v
}

function getInicialNum(id) {
  return parseNum(document.getElementById(id).value)
}

function setInicialVal(id, val) {
  const el = document.getElementById(id)
  if (el && val != null) el.value = val
}

async function cargarInicial() {
  const zafraId = document.getElementById('sel-zafra').value
  if (!zafraId) return
  try {
    const d = await obtenerInicial(zafraId)
    if (!d) return
    setInicialVal('inicial-jm-sac',      d.jm_sac_fecha)
    setInicialVal('inicial-miel-sac',    d.miel_sac_fecha)
    setInicialVal('inicial-cachaza-sac', d.cachaza_sac_fecha)
    setInicialVal('inicial-azucar-sac',  d.azucar_sac_fecha)
    setInicialVal('inicial-bagazo-sac',   d.bagazo_sac_fecha)
    setInicialVal('inicial-cana-fecha',   d.cana_fecha_anterior)
    setInicialVal('inicial-agua-fecha',   d.agua_fecha_anterior)
    setInicialVal('inicial-jm-tons-fecha', d.jm_tons_fecha_anterior)
    setInicialVal('inicial-tons-fisica',  d.tons_fisica_anterior)
    setInicialVal('inicial-sac-rec',     d.sacarosa_recuperable_anterior)
  } catch { /* sin datos */ }
}

async function guardarInicialFn() {
  const fecha   = document.getElementById('sel-fecha').value
  const zafraId = document.getElementById('sel-zafra').value
  const banner  = document.getElementById('banner-inicial')

  if (!fecha || !zafraId) {
    banner.textContent   = 'Selecciona una fecha y una zafra.'
    banner.className     = 'ingreso-banner ingreso-banner-error'
    banner.style.display = 'block'
    return
  }

  try {
    await guardarInicial({
      fecha,
      zafra_id:                      zafraId,
      jm_sac_fecha:                  getInicialNum('inicial-jm-sac'),
      miel_sac_fecha:                getInicialNum('inicial-miel-sac'),
      cachaza_sac_fecha:             getInicialNum('inicial-cachaza-sac'),
      azucar_sac_fecha:              getInicialNum('inicial-azucar-sac'),
      bagazo_sac_fecha:              getInicialNum('inicial-bagazo-sac'),
      cana_fecha_anterior:           getInicialNum('inicial-cana-fecha'),
      agua_fecha_anterior:           getInicialNum('inicial-agua-fecha'),
      jm_tons_fecha_anterior:        getInicialNum('inicial-jm-tons-fecha'),
      tons_fisica_anterior:          getInicialNum('inicial-tons-fisica'),
      sacarosa_recuperable_anterior: getInicialNum('inicial-sac-rec'),
    })
    banner.textContent   = 'Carga inicial guardada correctamente.'
    banner.className     = 'ingreso-banner ingreso-banner-ok'
    banner.style.display = 'block'
  } catch (err) {
    banner.textContent   = err.message
    banner.className     = 'ingreso-banner ingreso-banner-error'
    banner.style.display = 'block'
  }
}

// ─── Cargar datos existentes ──────────────────────────────────────────────────

function limpiarCampos() {
  const ids = [
    'cana_recibida_dia_ton', 'agua_imbibicion_dia_ton',
    'jugo_mezclado_dia_tons', 'jugo_mezclado_sacarosa',
    'bagazo_sacarosa_pct', 'miel_final_sacarosa',
    'miel_final_fisica_tons', 'sacarosa_a_miel_final_tons',
    'sacarosa_recuperable_tons', 'filtro_banda_pol', 'cachaza_dia_tons',
    'refinado_tons', 'refinado_pol_pct',
    'estandar_tons', 'estandar_pol_pct',
    'crudo_tons', 'crudo_pol_pct',
  ]
  ids.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.value = ''
  })
}

async function cargarDatos() {
  const fecha   = document.getElementById('sel-fecha').value
  const zafraId = document.getElementById('sel-zafra').value
  if (!fecha || !zafraId) return

  limpiarCampos()

  try {
    const d = await obtenerDia(fecha, zafraId)
    if (!d) return

    setVal('cana_recibida_dia_ton',        d.molienda?.cana_recibida_tons)
    setVal('agua_imbibicion_dia_ton',      d.molienda?.agua_imbibicion_tons)
    setVal('jugo_mezclado_dia_tons',       d.jugo_mezclado?.tons)
    setVal('jugo_mezclado_sacarosa',       d.jugo_mezclado?.sacarosa_pct)
    setVal('bagazo_sacarosa_pct',          d.bagazo?.sacarosa_pct)
    setVal('miel_final_sacarosa',          d.miel_final?.sacarosa_pct)
    setVal('miel_final_fisica_tons',       d.miel_final?.tons_fisica)
    setVal('sacarosa_a_miel_final_tons',   d.miel_final?.sacarosa_a_miel_final_tons)
    setVal('sacarosa_recuperable_tons',    d.miel_final?.sacarosa_recuperable_tons)
    setVal('filtro_banda_pol',             d.cachaza?.sacarosa_pct)
    setVal('cachaza_dia_tons',             d.cachaza?.tons)
    setVal('refinado_tons',                d.produccion?.refinado_tons)
    setVal('refinado_pol_pct',             d.produccion?.refinado_pol_pct)
    setVal('estandar_tons',                d.produccion?.estandar_tons)
    setVal('estandar_pol_pct',             d.produccion?.estandar_pol_pct)
    setVal('crudo_tons',                   d.produccion?.crudo_tons)
    setVal('crudo_pol_pct',                d.produccion?.crudo_pol_pct)
  } catch { /* sin datos para esta fecha */ }
}

function setVal(id, val) {
  const el = document.getElementById(id)
  if (el && val != null) el.value = val
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

  const getNum = id => parseNum(document.getElementById(id).value)

  try {
    await guardarDia({
      fecha,
      zafra_id:                      zafraId,
      cana_recibida_dia_ton:         getNum('cana_recibida_dia_ton'),
      agua_imbibicion_dia_ton:       getNum('agua_imbibicion_dia_ton'),
      jugo_mezclado_dia_tons:        getNum('jugo_mezclado_dia_tons'),
      jugo_mezclado_sacarosa:        getNum('jugo_mezclado_sacarosa'),
      bagazo_sacarosa_pct:           getNum('bagazo_sacarosa_pct'),
      miel_final_sacarosa:           getNum('miel_final_sacarosa'),
      filtro_banda_pol:              getNum('filtro_banda_pol'),
      miel_final_fisica_tons:        getNum('miel_final_fisica_tons'),
      sacarosa_a_miel_final_tons:    getNum('sacarosa_a_miel_final_tons'),
      sacarosa_recuperable_tons:     getNum('sacarosa_recuperable_tons'),
      cachaza_dia_tons:              getNum('cachaza_dia_tons'),
      refinado_tons:                 getNum('refinado_tons'),
      refinado_pol_pct:              getNum('refinado_pol_pct'),
      estandar_tons:                 getNum('estandar_tons'),
      estandar_pol_pct:              getNum('estandar_pol_pct'),
      crudo_tons:                    getNum('crudo_tons'),
      crudo_pol_pct:                 getNum('crudo_pol_pct'),
    })
    mostrarBanner('Datos guardados correctamente.', 'ok')
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
