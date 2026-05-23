import { listarZafras }                    from '../api/ingreso.js'
import { obtenerCordia, obtenerUltimoDia } from '../api/cordia.js'
import { getUser, cerrarSesion, navegarA } from '../router.js'
import { mostrarModalCambiarPassword }     from './cambiar-password.js'

const ROLES_ADMIN = ['super_admin', 'admin']

export async function renderDashboard() {
  const user    = getUser()
  const esAdmin = ROLES_ADMIN.includes(user?.role)

  document.getElementById('app').innerHTML = `
    <div class="dashboard-layout">

      <header class="topbar">
        <div class="topbar-logo">Sucro<span>lytics</span></div>
        <nav class="topbar-nav">
          <button class="topbar-link" id="link-datos">Ingreso de Datos</button>
          <button class="topbar-link" id="link-cordia">Cordia</button>
          ${esAdmin ? '<button class="topbar-link" id="link-usuarios">Usuarios</button>' : ''}
          <button class="topbar-link" id="btn-cambiar-pwd">Mi contraseña</button>
          <div class="topbar-divider"></div>
          <span class="topbar-name">${user?.name ?? ''}</span>
          <span class="topbar-role">${user?.role ?? ''}</span>
          <button class="btn-logout" id="btn-logout">Salir</button>
        </nav>
      </header>

      <main class="dashboard-main">
        <div id="dash-content" style="color:var(--gris)">Cargando…</div>
      </main>
    </div>
  `

  document.getElementById('btn-logout').addEventListener('click', cerrarSesion)
  document.getElementById('btn-cambiar-pwd').addEventListener('click', mostrarModalCambiarPassword)
  document.getElementById('link-datos').addEventListener('click', () => navegarA('ingreso-datos'))
  document.getElementById('link-cordia').addEventListener('click', () => navegarA('cordia'))
  if (esAdmin) {
    document.getElementById('link-usuarios').addEventListener('click', () => navegarA('usuarios'))
  }

  await cargarResumen(user, esAdmin)
}

async function cargarResumen(user, esAdmin) {
  const cont = document.getElementById('dash-content')
  try {
    const zafras = await listarZafras() ?? []
    const zafra  = zafras.find(z => z.is_active) ?? zafras[0]

    if (!zafra) {
      cont.innerHTML = `
        <h1 class="dashboard-title" style="margin-bottom:8px">Sin zafra activa</h1>
        <p class="dashboard-sub">Configura una zafra activa para ver el resumen del balance.</p>
      `
      return
    }

    let fecha = null
    let d     = null
    try {
      const u = await obtenerUltimoDia(zafra.id)
      fecha = u?.fecha
      if (fecha) d = await obtenerCordia(fecha, zafra.id)
    } catch { /* sin datos aún */ }

    cont.innerHTML = renderResumen(zafra, fecha, d, user, esAdmin)

    document.getElementById('nav-datos').addEventListener('click', () => navegarA('ingreso-datos'))
    document.getElementById('nav-cordia').addEventListener('click', () => navegarA('cordia'))
    if (esAdmin && document.getElementById('nav-usuarios')) {
      document.getElementById('nav-usuarios').addEventListener('click', () => navegarA('usuarios'))
    }
  } catch (err) {
    cont.innerHTML = `<p style="color:var(--rojo)">${err.message}</p>`
  }
}

function fmtT(v) {
  if (v == null) return '—'
  return Number(v).toLocaleString('es-MX', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

function fmtPct(v) {
  if (v == null) return '—'
  return Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %'
}

function renderResumen(zafra, fecha, d, user, esAdmin) {
  const fechaLabel = fecha
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Sin datos registrados'

  const rec = (d?.azucar_pye_dia != null && d?.pol_en_cana_dia > 0)
    ? d.azucar_pye_dia / d.pol_en_cana_dia * 100
    : null

  const kpis = [
    {
      label:    'Caña Molida',
      val:      fmtT(d?.cana_molida_dia),
      unit:     't',
      acum:     null,
      color:    '#065f46',
      fondo:    '#d1fae5',
      borde:    '#6ee7b7',
    },
    {
      label:    'Jugo Mezclado Sacarosa Aparente',
      val:      fmtT(d?.jm_sac_dia),
      unit:     't',
      acum:     fmtT(d?.jm_sac_fecha),
      color:    '#1e40af',
      fondo:    '#dbeafe',
      borde:    '#93c5fd',
    },
    {
      label:    'POL en Caña',
      val:      fmtT(d?.pol_en_cana_dia),
      unit:     't',
      acum:     fmtT(d?.pol_en_cana_fecha),
      color:    '#065f46',
      fondo:    '#d1fae5',
      borde:    '#6ee7b7',
    },
    {
      label:    'Sacarosa en Azúcar',
      val:      fmtT(d?.azucar_pye_dia),
      unit:     't',
      acum:     fmtT(d?.azucar_pye_fecha),
      color:    '#1e40af',
      fondo:    '#dbeafe',
      borde:    '#93c5fd',
    },
    {
      label:    'Pérdidas Totales',
      val:      fmtT(d?.perdidas_totales_dia),
      unit:     't',
      acum:     fmtT(d?.perdidas_totales_fecha),
      color:    '#991b1b',
      fondo:    '#fee2e2',
      borde:    '#fca5a5',
    },
    {
      label:    'Recuperación',
      val:      fmtPct(rec),
      unit:     '',
      acum:     null,
      color:    rec == null ? '#6b7280' : rec >= 85 ? '#065f46' : rec >= 80 ? '#92400e' : '#991b1b',
      fondo:    rec == null ? '#f3f4f6' : rec >= 85 ? '#d1fae5' : rec >= 80 ? '#fef3c7' : '#fee2e2',
      borde:    rec == null ? '#d1d5db' : rec >= 85 ? '#6ee7b7' : rec >= 80 ? '#fde68a' : '#fca5a5',
    },
  ]

  const kpiCards = kpis.map(k => `
    <div style="background:#fff;border:1px solid ${k.borde};border-top:3px solid ${k.color};
                border-radius:12px;padding:20px 24px;
                box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
                  color:var(--gris);margin-bottom:10px">${k.label}</div>
      <div style="font-size:1.6rem;font-weight:800;color:${k.color};font-variant-numeric:tabular-nums;
                  line-height:1.1">
        ${k.val}<span style="font-size:.9rem;font-weight:500;margin-left:4px">${k.val !== '—' ? k.unit : ''}</span>
      </div>
      ${k.acum ? `
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid ${k.borde};
                    font-size:.78rem;color:var(--gris);display:flex;justify-content:space-between">
          <span>Acumulado zafra</span>
          <span style="font-variant-numeric:tabular-nums;font-weight:600;color:#374151">${k.acum} t</span>
        </div>` : ''}
    </div>
  `).join('')

  const navCards = `
    <button id="nav-datos" style="text-align:left;background:#fff;border:1.5px solid var(--gris-borde);
            border-radius:12px;padding:24px 28px;cursor:pointer;transition:all .15s;
            box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.6px;
                  color:var(--verde);margin-bottom:6px">Ingreso de Datos</div>
      <div style="font-size:1rem;font-weight:700;color:#111827;margin-bottom:6px">Registrar datos del día</div>
      <div style="font-size:.85rem;color:var(--gris)">Laboratorio, molienda, producción y análisis de proceso</div>
    </button>
    <button id="nav-cordia" style="text-align:left;background:#fff;border:1.5px solid var(--gris-borde);
            border-radius:12px;padding:24px 28px;cursor:pointer;transition:all .15s;
            box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.6px;
                  color:var(--verde);margin-bottom:6px">Corrida Diaria</div>
      <div style="font-size:1rem;font-weight:700;color:#111827;margin-bottom:6px">Balance de POL</div>
      <div style="font-size:.85rem;color:var(--gris)">Pérdidas, acumulados y producción por fecha o período</div>
    </button>
    ${esAdmin ? `
    <button id="nav-usuarios" style="text-align:left;background:#fff;border:1.5px solid var(--gris-borde);
            border-radius:12px;padding:24px 28px;cursor:pointer;transition:all .15s;
            box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.6px;
                  color:var(--verde);margin-bottom:6px">Administración</div>
      <div style="font-size:1rem;font-weight:700;color:#111827;margin-bottom:6px">Usuarios</div>
      <div style="font-size:.85rem;color:var(--gris)">Gestión de accesos y permisos por rol</div>
    </button>` : ''}
  `

  return `
    <!-- Encabezado zafra -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;
                flex-wrap:wrap;gap:12px;margin-bottom:32px">
      <div>
        <h1 class="dashboard-title" style="margin-bottom:4px">${zafra.name}</h1>
        <p class="dashboard-sub" style="margin-bottom:0">
          Último día con datos:
          <strong style="color:#111827">${fechaLabel}</strong>
        </p>
      </div>
      ${fecha ? `
      <div style="font-size:.78rem;background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;
                  border-radius:6px;padding:4px 12px;align-self:center;font-weight:600">
        DIA — ${fecha}
      </div>` : ''}
    </div>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;
                margin-bottom:40px">
      ${kpiCards}
    </div>

    <!-- Módulos -->
    <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.6px;
                color:var(--gris);margin-bottom:14px">Módulos</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">
      ${navCards}
    </div>
  `
}
