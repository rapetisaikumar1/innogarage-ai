import { app, shell } from 'electron'
import type { PlatformBehavior } from './types'
import icon from '../../../resources/icon.png?asset'

const APP_USER_MODEL_ID = 'com.innogarage.meeting-notes'
const PUBLIC_WINDOW_TITLE = 'innogarage.ai'
const STEALTH_WINDOW_TITLE = 'Meeting Notes'

const win32: PlatformBehavior = {
  earlySetup() {
    app.setAppUserModelId(APP_USER_MODEL_ID)
  },

  windowOptions() {
    return {
      transparent: false,
      backgroundColor: '#1a1a2e',
      icon
    }
  },

  onWindowCreated(win) {
    win.setTitle(PUBLIC_WINDOW_TITLE)
  },

  bindContentProtectionEvents(win, reapply) {
    // WDA_EXCLUDEFROMCAPTURE can be reset by the OS after ANY window state
    // change. Re-apply on every such event.
    win.on('focus', reapply)
    win.on('show', reapply)
    win.on('move', reapply)
    win.on('resize', reapply)
    win.on('maximize', reapply)
    win.on('unmaximize', reapply)
    win.on('restore', reapply)
  },

  applyContentProtection(win, enabled) {
    win.setContentProtection(enabled)
  },

  applyOverlayMode(win, enabled) {
    win.setOpacity(enabled ? 0.85 : 1.0)
  },

  setAlwaysOnTop(win, flag) {
    win.setAlwaysOnTop(flag, 'screen-saver')
  },

  setSkipTaskbar(win, flag) {
    win.setSkipTaskbar(flag)
    win.setTitle(flag ? STEALTH_WINDOW_TITLE : PUBLIC_WINDOW_TITLE)
  },

  appUserModelId() {
    return APP_USER_MODEL_ID
  },

  shouldQuitOnAllClosed() {
    return true
  },

  openScreenSettings() {
    shell.openExternal('ms-settings:privacy-graphicscapturewithoutborder')
  },

  getScreenPermissionStatus() {
    return 'granted' // Windows has no global screen-recording gate
  },

  contentProtectionDelay() {
    return 0
  },

  cleanup() {
    // No cleanup needed
  }
}

export default win32
