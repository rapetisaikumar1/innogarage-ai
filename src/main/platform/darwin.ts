import { app, shell, systemPreferences } from 'electron'
import type { BrowserWindow } from 'electron'
import type { PlatformBehavior } from './types'

const STEALTH_WINDOW_TITLE = 'Meeting Notes'
let stealthIdentityActive = false
let publicWindowTitle = 'innogarage.ai'

function setDockVisibility(visible: boolean): void {
  if (!app.dock) return
  if (visible) app.dock.show()
  else app.dock.hide()
}

function applyStealthIdentity(win: BrowserWindow, enabled: boolean): void {
  if (win.isDestroyed()) return

  stealthIdentityActive = enabled

  const nextTitle = enabled ? STEALTH_WINDOW_TITLE : publicWindowTitle
  if (win.getTitle() !== nextTitle) win.setTitle(nextTitle)

  try {
    win.excludedFromShownWindowsMenu = enabled
  } catch {
    console.warn('[darwin] excludedFromShownWindowsMenu toggle failed')
  }

  try {
    win.setSkipTaskbar(enabled)
  } catch {
    console.warn('[darwin] setSkipTaskbar toggle failed')
  }

  try {
    app.setActivationPolicy(enabled ? 'accessory' : 'regular')
  } catch {
    console.warn('[darwin] setActivationPolicy toggle failed')
  }

  setDockVisibility(!enabled)
}

function applyProtectedSurface(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  win.setContentProtection(true)
  try { win.setHiddenInMissionControl(true) } catch { console.warn('[darwin] setHiddenInMissionControl(true) failed') }
}

const darwin: PlatformBehavior = {
  earlySetup() {
    publicWindowTitle = app.getName() || publicWindowTitle
    return undefined
  },

  windowOptions() {
    return {
      transparent: false,
      backgroundColor: '#1a1a2e',
      hasShadow: false
    }
  },

  onWindowCreated(win) {
    publicWindowTitle = win.getTitle() || publicWindowTitle
    win.on('page-title-updated', (event, title) => {
      event.preventDefault()
      if (title) {
        publicWindowTitle = title
      }
      if (stealthIdentityActive) {
        applyStealthIdentity(win, true)
      } else if (win.getTitle() !== publicWindowTitle) {
        win.setTitle(publicWindowTitle)
      }
    })
  },

  bindContentProtectionEvents(win, reapply) {
    win.on('focus', reapply)
    win.on('show', reapply)
    win.on('move', reapply)
    win.on('resize', reapply)
    win.on('restore', reapply)
    win.on('maximize', reapply)
    win.on('unmaximize', reapply)
    win.on('enter-full-screen', reapply)
    win.on('leave-full-screen', reapply)
    win.webContents.on('did-finish-load', reapply)
  },

  applyContentProtection(win, enabled) {
    if (win.isDestroyed()) return
    if (enabled) {
      applyProtectedSurface(win)
    } else {
      try { win.setHiddenInMissionControl(false) } catch { console.warn('[darwin] setHiddenInMissionControl(false) failed') }
      win.setContentProtection(false)
    }
  },

  applyOverlayMode(win, enabled) {
    win.setBackgroundColor('#1a1a2e')
    win.setOpacity(enabled ? 0.88 : 1.0)
  },

  setAlwaysOnTop(win, flag) {
    win.setAlwaysOnTop(flag, 'screen-saver')
    win.setVisibleOnAllWorkspaces(flag, { visibleOnFullScreen: true, skipTransformProcessType: true })
  },

  setSkipTaskbar(win, flag) {
    applyStealthIdentity(win, flag)
  },

  appUserModelId() {
    return 'com.innogarage'
  },

  shouldQuitOnAllClosed() {
    return false
  },

  openScreenSettings() {
    shell.openExternal(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
    )
  },

  getScreenPermissionStatus() {
    return systemPreferences.getMediaAccessStatus('screen')
  },

  contentProtectionDelay() {
    return 0
  },

  cleanup() {
    setDockVisibility(true)
  }
}

export default darwin
