/**
 * login.js — Página de inicio de sesión
 *
 * Flujo:
 *  1. El usuario ingresa su usuario y contraseña
 *  2. Se hace POST a /api/auth/login
 *  3. Si es exitoso → guarda token + datos en localStorage → redirige al dashboard
 *  4. Si falla → muestra el mensaje de error en el formulario
 */

// ─────────────────────────────────────────────
//  Capa de API
// ─────────────────────────────────────────────

/**
 * Llama al endpoint de login.
 * @param {string} usuario  — email del usuario
 * @param {string} password — contraseña en texto plano
 * @returns {{ access_token, user }} en caso exitoso
 * @throws {Error} con mensaje legible para el usuario
 */
import { BASE_URL } from '../api/client.js'

async function apiLogin(usuario, password) {
  // Si el servidor no responde, fetch lanza TypeError
  let res
  try {
    res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password }),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend?')
  }

  // Si la respuesta no es JSON (cuerpo vacío, HTML de error, proxy caído),
  // damos un mensaje claro en lugar de mostrar el error técnico de parseo.
  let data
  try {
    data = await res.json()
  } catch {
    throw new Error(`Error del servidor (${res.status}). Revisa la consola del backend.`)
  }

  if (!res.ok) {
    // El backend siempre devuelve { detail: "..." } en errores 4xx / 5xx
    throw new Error(data.detail || 'Error al iniciar sesión')
  }

  return data
}

// ─────────────────────────────────────────────
//  Sesión
// ─────────────────────────────────────────────

/**
 * Persiste el token JWT y los datos del usuario.
 * El token se adjunta en cada petición autenticada posterior.
 */
function guardarSesion({ access_token, user }) {
  localStorage.setItem('token', access_token)
  localStorage.setItem('user', JSON.stringify(user))
}

// ─────────────────────────────────────────────
//  UI helpers
// ─────────────────────────────────────────────

function mostrarError(el, mensaje) {
  el.textContent = mensaje
  el.classList.add('visible')
}

function ocultarError(el) {
  el.classList.remove('visible')
}

function setBloqueado(btn, bloqueado) {
  btn.disabled    = bloqueado
  btn.textContent = bloqueado ? 'Ingresando…' : 'Ingresar'
}

// ─────────────────────────────────────────────
//  Renderizado principal
// ─────────────────────────────────────────────

/**
 * Monta la pantalla de login en #app y conecta los eventos del formulario.
 * Se llama desde main.js al arrancar la app.
 */
export function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">

      <!-- Panel izquierdo: formulario de autenticación -->
      <div class="login-panel">
        <div class="login-logo">Sucro<span>lytics</span></div>
        <div class="login-sub">Balance de POL · Gestión de Zafra</div>

        <!-- Banner de error (oculto por defecto; visible con clase .visible) -->
        <div class="login-error" id="login-error"></div>

        <form id="login-form" novalidate>
          <label class="form-label" for="usuario">Usuario</label>
          <input
            class="form-input"
            id="usuario"
            type="text"
            placeholder="Ingresa tu usuario"
            autocomplete="username"
            required
          />

          <label class="form-label" for="password">Contraseña</label>
          <input
            class="form-input"
            id="password"
            type="password"
            placeholder="Ingresa tu contraseña"
            autocomplete="current-password"
            required
          />

          <button class="btn-login" type="submit" id="btn-submit">
            Ingresar
          </button>
        </form>
      </div>

      <!-- Panel derecho: imagen decorativa -->
      <div class="login-bg">
        <div class="login-bg-icon">🌿</div>
        <div class="login-bg-text">Sistema de Balance de Caña</div>
        <div>Ingenio · Zafra · POL</div>
      </div>

    </div>
  `

  const form   = document.getElementById('login-form')
  const errBox = document.getElementById('login-error')
  const btn    = document.getElementById('btn-submit')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    ocultarError(errBox)
    setBloqueado(btn, true)

    const usuario  = document.getElementById('usuario').value.trim()
    const password = document.getElementById('password').value

    try {
      const data = await apiLogin(usuario, password)
      guardarSesion(data)
      window.location.hash = 'dashboard'
    } catch (err) {
      mostrarError(errBox, err.message)
    } finally {
      setBloqueado(btn, false)
    }
  })
}
