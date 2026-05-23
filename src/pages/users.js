/**
 * users.js — Gestión de usuarios (CRUD)
 * Acceso: solo admin y super_admin
 *
 * Flujo:
 *  renderUsuarios() → carga tabla → abrirModal() para crear/editar
 *                                 → confirmarEliminar() para borrar
 */

import { listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../api/users.js'
import { navegarA, getUser } from '../router.js'

// Mapeo de roles a etiquetas en español
const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin',       label: 'Administrador' },
  { value: 'supervisor',  label: 'Supervisor' },
  { value: 'operator',    label: 'Operador' },
  { value: 'lab',         label: 'Laboratorio' },
  { value: 'readonly',    label: 'Solo Lectura' },
]
const ROL_LABEL = Object.fromEntries(ROLES.map(r => [r.value, r.label]))

// Cache local de usuarios para el modal de edición
let _usuarios = []

// ─── Render principal ─────────────────────────────────────────────────────────

export function renderUsuarios() {
  document.getElementById('app').innerHTML = `
    <div class="page-layout">
      <header class="page-header">
        <button class="btn-back" id="btn-back">← Dashboard</button>
        <h1 class="page-title">Gestión de Usuarios</h1>
        <button class="btn-primary" id="btn-nuevo">+ Nuevo Usuario</button>
      </header>

      <main class="page-main">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tbody-usuarios">
              <tr><td colspan="6" class="table-loading">Cargando…</td></tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  `

  document.getElementById('btn-back').addEventListener('click', () => navegarA('dashboard'))
  document.getElementById('btn-nuevo').addEventListener('click', () => abrirModal())

  // Event delegation — un solo listener para todos los botones de la tabla
  document.getElementById('tbody-usuarios').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const { action, id } = btn.dataset
    if (action === 'edit')   abrirModal(_usuarios.find(u => u.id === id))
    if (action === 'delete') confirmarEliminar(id, btn.dataset.name)
  })

  cargarUsuarios()
}

// ─── Tabla ────────────────────────────────────────────────────────────────────

async function cargarUsuarios() {
  const tbody = document.getElementById('tbody-usuarios')
  try {
    _usuarios = await listarUsuarios() ?? []

    if (_usuarios.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Sin usuarios registrados</td></tr>'
      return
    }

    tbody.innerHTML = _usuarios.map(u => `
      <tr>
        <td><code>${u.username}</code></td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><span class="role-badge role-${u.role}">${ROL_LABEL[u.role] ?? u.role}</span></td>
        <td><span class="${u.is_active ? 'status-active' : 'status-inactive'}">${u.is_active ? 'Activo' : 'Inactivo'}</span></td>
        <td class="table-actions">
          <button class="btn-icon" data-action="edit"   data-id="${u.id}">✏️</button>
          <button class="btn-icon btn-icon-danger" data-action="delete" data-id="${u.id}" data-name="${u.name}">🗑️</button>
        </td>
      </tr>
    `).join('')
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-error">${err.message}</td></tr>`
  }
}

// ─── Modal crear / editar ─────────────────────────────────────────────────────

function abrirModal(usuario = null) {
  const esEditar = !!usuario
  const miRol    = getUser()?.role

  // Un admin no puede crear ni editar super_admin
  const opcionesRol = ROLES
    .filter(r => miRol === 'super_admin' || r.value !== 'super_admin')
    .map(r => `<option value="${r.value}" ${usuario?.role === r.value ? 'selected' : ''}>${r.label}</option>`)
    .join('')

  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.id = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">${esEditar ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
        <button class="modal-close" id="modal-close">✕</button>
      </div>

      <div class="modal-error" id="modal-error"></div>

      <form id="modal-form" class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nombre completo</label>
            <input class="form-input" name="name" value="${usuario?.name ?? ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Usuario</label>
            <input class="form-input" name="username" value="${usuario?.username ?? ''}" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" name="email" type="email" value="${usuario?.email ?? ''}" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Rol</label>
            <select class="form-input" name="role">${opcionesRol}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Estado</label>
            <label class="toggle-label">
              <input type="checkbox" name="is_active" ${usuario?.is_active !== false ? 'checked' : ''} />
              <span>Activo</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            ${esEditar ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
          </label>
          <input class="form-input" name="password" type="password" ${esEditar ? '' : 'required'} />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="btn-primary" id="btn-guardar">Guardar</button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(overlay)

  const cerrar = () => overlay.remove()
  overlay.querySelector('#modal-close').addEventListener('click', cerrar)
  overlay.querySelector('#btn-cancelar').addEventListener('click', cerrar)
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrar() })

  overlay.querySelector('#modal-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const errEl = overlay.querySelector('#modal-error')
    const btnG  = overlay.querySelector('#btn-guardar')
    errEl.style.display = 'none'
    btnG.disabled = true
    btnG.textContent = 'Guardando…'

    const fd   = new FormData(e.target)
    const body = {
      name:      fd.get('name').trim(),
      username:  fd.get('username').trim(),
      email:     fd.get('email').trim(),
      role:      fd.get('role'),
      is_active: fd.get('is_active') === 'on',
    }
    const pw = fd.get('password')
    if (pw) body.password = pw

    try {
      if (esEditar) {
        await actualizarUsuario(usuario.id, body)
      } else {
        if (!body.password) throw new Error('La contraseña es obligatoria')
        await crearUsuario(body)
      }
      cerrar()
      cargarUsuarios()
    } catch (err) {
      errEl.textContent    = err.message
      errEl.style.display  = 'block'
      btnG.disabled        = false
      btnG.textContent     = 'Guardar'
    }
  })

  setTimeout(() => overlay.querySelector('input[name="name"]').focus(), 50)
}

// ─── Confirmación eliminar ────────────────────────────────────────────────────

function confirmarEliminar(id, nombre) {
  if (!confirm(`¿Eliminar al usuario "${nombre}"?\nEsta acción no se puede deshacer.`)) return
  eliminarUsuario(id)
    .then(cargarUsuarios)
    .catch(err => alert(err.message))
}
