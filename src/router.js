/**
 * router.js — Enrutador SPA
 *
 * Rutas disponibles (via window.location.hash):
 *   #login     → pantalla de login (pública)
 *   #dashboard → panel principal (requiere auth)
 *   #usuarios  → gestión de usuarios (requiere admin+)
 */

import { renderLogin }           from './pages/login.js'
import { renderDashboard }       from './pages/dashboard.js'
import { renderUsuarios }        from './pages/users.js'
import { renderIngresoBalance }  from './pages/ingreso-balance.js'
import { renderCalculoBalance }  from './pages/calculo-balance.js'
import { renderIngresoDatos }    from './pages/ingreso-datos.js'
import { renderCordia }          from './pages/cordia.js'

const ROLES_ADMIN = ['super_admin', 'admin']

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem('token')
}

export function getUser() {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export function cerrarSesion() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  navegarA('login')
}

// ─── Navegación ───────────────────────────────────────────────────────────────

export function navegarA(ruta) {
  window.location.hash = ruta
}

// ─── Enrutador principal ──────────────────────────────────────────────────────

function resolverRuta() {
  const hash  = window.location.hash.replace('#', '') || 'login'
  const token = getToken()
  const user  = getUser()

  // Sin token → solo se puede ver el login
  if (!token && hash !== 'login') {
    navegarA('login')
    return
  }

  // Ya autenticado → no puede volver al login
  if (token && hash === 'login') {
    navegarA('dashboard')
    return
  }

  // Ruta de usuarios solo para admin+
  if (hash === 'usuarios' && !ROLES_ADMIN.includes(user?.role)) {
    navegarA('dashboard')
    return
  }

  switch (hash) {
    case 'dashboard':       renderDashboard();      break
    case 'usuarios':        renderUsuarios();       break
    case 'ingreso-balance': renderIngresoBalance(); break
    case 'calculo-balance': renderCalculoBalance(); break
    case 'ingreso-datos':   renderIngresoDatos();   break
    case 'cordia':          renderCordia();         break
    case 'login':           renderLogin();          break
    default:                renderLogin();          break
  }
}

window.addEventListener('hashchange', resolverRuta)

export function iniciarRouter() {
  resolverRuta()
}
