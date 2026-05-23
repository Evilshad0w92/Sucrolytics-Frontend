/**
 * cambiar-password.js — Modal para cambiar la contraseña propia
 * Disponible para todos los roles autenticados.
 */

import { cambiarPassword } from '../api/users.js'

export function mostrarModalCambiarPassword() {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.id = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Cambiar Contraseña</h2>
        <button class="modal-close" id="modal-close">✕</button>
      </div>

      <div class="modal-error" id="modal-error"></div>

      <form id="pwd-form" class="modal-body">
        <div class="form-group">
          <label class="form-label">Contraseña actual</label>
          <input class="form-input" name="password_actual" type="password" required />
        </div>
        <div class="form-group">
          <label class="form-label">Nueva contraseña</label>
          <input class="form-input" name="password_nuevo" type="password" required />
        </div>
        <div class="form-group">
          <label class="form-label">Confirmar nueva contraseña</label>
          <input class="form-input" name="password_confirmar" type="password" required />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="btn-primary" id="btn-cambiar">Cambiar</button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(overlay)

  const cerrar = () => overlay.remove()
  overlay.querySelector('#modal-close').addEventListener('click', cerrar)
  overlay.querySelector('#btn-cancelar').addEventListener('click', cerrar)
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrar() })

  overlay.querySelector('#pwd-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const errEl = overlay.querySelector('#modal-error')
    const btn   = overlay.querySelector('#btn-cambiar')
    errEl.style.display = 'none'

    const fd                = new FormData(e.target)
    const password_actual   = fd.get('password_actual')
    const password_nuevo    = fd.get('password_nuevo')
    const password_confirmar = fd.get('password_confirmar')

    if (password_nuevo !== password_confirmar) {
      errEl.textContent   = 'Las contraseñas nuevas no coinciden'
      errEl.style.display = 'block'
      return
    }

    btn.disabled    = true
    btn.textContent = 'Cambiando…'

    try {
      await cambiarPassword({ password_actual, password_nuevo })
      cerrar()
      alert('Contraseña actualizada correctamente')
    } catch (err) {
      errEl.textContent   = err.message
      errEl.style.display = 'block'
      btn.disabled        = false
      btn.textContent     = 'Cambiar'
    }
  })

  setTimeout(() => overlay.querySelector('input[name="password_actual"]').focus(), 50)
}
