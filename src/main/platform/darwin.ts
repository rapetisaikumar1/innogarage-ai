import { shell, systemPreferences } from 'electron'
import type { BrowserWindow } from 'electron'
import type { PlatformBehavior } from './types'

// macOS NSWindowSharingNone state can be cleared briefly by the OS during
// window state changes (setAlwaysOnTop, space switch, focus, full-screen
// transitions). Zoom and Microsoft Teams use ScreenCaptureKit which captures
// continuously — any gap is enough for a frame to leak. We mitigate with:
//   1) Aggressive heartbeat (re-apply every 500ms)
//   2) Re-apply on EVERY window event that can reset it
//   3) Apply immediately (no debounce delay)
//   4) Hide from Mission Control + window switcher to reduce surface area
const HEARTBEAT_MS = 500
let cpHeartbeat: ReturnType<typeof setInterval> | null = null
let cpActive = false  // whether content protection is currently desired

function startHeartbeat(win: BrowserWindow): void {
  if (cpHeartbeat) return
  cpHeartbeat = setInterval(() => {
    if (win.isDestroyed()) { stopHeartbeat(); return }
    win.setContentProtection(true)
  }, HEARTBEAT_MS)
}

function stopHeartbeat(): void {
  if (cpHeartbeat) { clearInterval(cpHeartbeat); cpHeartbeat = null }
}

const darwin: PlatformBehavior = {
  earlySetup() {},

  windowOptions() {
    return {
      transparent: true,
      backgroundColor: '#00000000'
    }
  },

  onWindowCreated(_win) {},

  bindContentProtectionEvents(win, reapply) {
    // Every event that may cause macOS to reset NSWindowSharingNone.
    // Captured here so reapply runs synchronously immediately after.
    win.on('focus', reapply)
    win.on('blur', reapply)
    win.on('show', reapply)
    win.on('hide', reapply)
    win.on('move', reapply)
    win.on('resize', reapply)
    win.on('minimize', reapply)
    win.on('restore', reapply)
    win.on('maximize', reapply)
    win.on('unmaximize', reapply)
    win.on('enter-full-screen', reapply)
    win.on('leave-full-screen', reapply)
  },

  applyContentProtection(win, enabled) {
    if (win.isDestroyed()) return
    cpActive = enabled
    win.setContentProtection(enabled)
    if (enabled) {
      // Reduce the OS surfaces where this window appears in screen capture.
      try { win.setHiddenInMissionControl(true) } catch {}
      startHeartbeat(win)
    } else {
      try { win.setHiddenInMissionControl(false) } catch {}
      stopHeartbeat()
    }
  },

  applyOverlayMode(win, enabled) {
    win.setBackgroundColor(enabled ? '#00000000' : '#1a1a2e')
  },

  setAlwaysOnTop(win, flag) {
    win.setAlwaysOnTop(flag, 'screen-saver')
    // setVisibleOnAllWorkspaces resets NSWindowSharingNone on macOS — Zoom
    // and Teams can capture the window during the gap before the heartbeat
    // fires. Re-apply immediately, then again on the next tick to cover the
    // post-AppKit-flush window where the OS resets the sharing flag.
    win.setVisibleOnAllWorkspaces(flag, { visibleOnFullScreen: true })
    if (cpActive && !win.isDestroyed()) {
      win.setContentProtection(true)
      setImmediate(() => {
        if (cpActive && !win.isDestroyed()) win.setContentProtection(true)
      })
    }
  },

  setSkipTaskbar(_win, _flag) {},

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
    // Apply immediately — any debounce delay is a window for screen capture
    // to grab a frame containing the app.
    return 0
  },

  cleanup() {
    stopHeartbeat()
  }
}

export default darwin
