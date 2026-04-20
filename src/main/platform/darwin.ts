import { shell, systemPreferences } from 'electron'
import type { PlatformBehavior } from './types'

const darwin: PlatformBehavior = {
  earlySetup() {
    // No early setup needed on macOS
  },

  windowOptions() {
    return {
      transparent: true,
      backgroundColor: '#00000000'
      // No icon on macOS — uses the .app bundle icon
    }
  },

  onWindowCreated(win) {
    // Prime the Quartz compositor early so subsequent setContentProtection(true)
    // calls are more reliable on fresh installs and across all macOS versions.
    win.setContentProtection(true)
    setTimeout(() => { if (!win.isDestroyed()) win.setContentProtection(false) }, 200)
  },

  bindContentProtectionEvents(win, reapply) {
    // macOS resets NSWindowSharingNone on focus, show, space transitions,
    // restore-from-minimize, and when leaving full-screen
    win.on('focus', reapply)
    win.on('show', reapply)
    win.on('enter-full-screen', reapply)
    win.on('leave-full-screen', reapply)
    win.on('restore', reapply)
  },

  applyContentProtection(win, enabled) {
    if (win.isDestroyed()) return
    win.setContentProtection(enabled)
    if (!enabled) return

    // macOS Quartz compositor resets NSWindowSharingNone at various points.
    // Re-apply with escalating delays to cover all macOS versions and hardware.
    for (const delay of [150, 350, 700]) {
      setTimeout(() => {
        if (!win.isDestroyed()) win.setContentProtection(true)
      }, delay)
    }

    // Bounds-redraw hack: forces the Quartz compositor to re-read NSWindowSharingNone.
    // Without this, some macOS systems cache the previous sharing type and the window
    // remains visible in screen capture even after setContentProtection(true).
    setTimeout(() => {
      if (win.isDestroyed()) return
      const b = win.getBounds()
      win.setBounds({ ...b, width: b.width + 1 })
      setTimeout(() => {
        if (win.isDestroyed()) return
        win.setBounds(b)
        win.setContentProtection(true)
      }, 50)
    }, 250)
  },

  applyOverlayMode(win, enabled) {
    win.setBackgroundColor(enabled ? '#00000000' : '#1a1a2e')
  },

  setAlwaysOnTop(win, flag) {
    win.setAlwaysOnTop(flag, 'screen-saver')
    win.setVisibleOnAllWorkspaces(flag, { visibleOnFullScreen: true })
  },

  setSkipTaskbar(_win, _flag) {
    // macOS doesn't have a taskbar hide equivalent via this API
  },

  appUserModelId() {
    return 'com.innogarage'
  },

  shouldQuitOnAllClosed() {
    return false // macOS convention: keep app alive
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
    return 350 // macOS needs a longer delay to cover all hardware/compositor reset scenarios
  },

  cleanup() {
    // No cleanup needed
  }
}

export default darwin
