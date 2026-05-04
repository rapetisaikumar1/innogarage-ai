// afterPack hook —
//   Windows: keeps exe metadata aligned with the neutral meeting-window identity
//   macOS:   ad-hoc codesigns the .app bundle before DMG packaging so the
//            distributed DMG contains a consistently signed local-test app.
const path = require('path')
const fs = require('fs')
const { execFileSync } = require('child_process')

function sign(target, entitlementsPath) {
  execFileSync(
    'codesign',
    [
      '--force',
      '--sign', '-',
      '--entitlements', entitlementsPath,
      '--options', 'runtime',
      '--timestamp=none',
      target
    ],
    { stdio: 'inherit' }
  )
}

// Re-sign an Electron .app from inside-out so every binary shares the same
// ad-hoc Team ID. Using --deep is NOT sufficient on macOS 14+ (Sonoma) and
// macOS 26 (Tahoe) — it leaves inner frameworks with their original Apple/
// Electron Team ID while the outer binary gets a blank ad-hoc Team ID,
// causing a "different Team IDs" crash at launch.
function signAppInsideOut(appPath, entitlementsPath) {
  const frameworksDir = path.join(appPath, 'Contents', 'Frameworks')
  const helpersDir = path.join(appPath, 'Contents', 'MacOS')

  // 1. Sign all nested .framework bundles (innermost first)
  if (fs.existsSync(frameworksDir)) {
    const entries = fs.readdirSync(frameworksDir)
    for (const entry of entries) {
      const fullPath = path.join(frameworksDir, entry)
      if (entry.endsWith('.framework')) {
        // Sign the Versions/A/<Framework> binary directly first, then the bundle
        const versionsA = path.join(fullPath, 'Versions', 'A', entry.replace('.framework', ''))
        if (fs.existsSync(versionsA)) {
          console.log(`[afterPack] Signing framework binary: ${versionsA}`)
          sign(versionsA, entitlementsPath)
        }
        console.log(`[afterPack] Signing framework: ${fullPath}`)
        sign(fullPath, entitlementsPath)
      } else if (entry.endsWith('.app')) {
        // Helper apps (e.g. GPU Process, Renderer, etc.)
        console.log(`[afterPack] Signing helper app: ${fullPath}`)
        sign(fullPath, entitlementsPath)
      }
    }
  }

  // 2. Sign all standalone binaries in MacOS/
  if (fs.existsSync(helpersDir)) {
    for (const bin of fs.readdirSync(helpersDir)) {
      const binPath = path.join(helpersDir, bin)
      if (fs.statSync(binPath).isFile()) {
        console.log(`[afterPack] Signing binary: ${binPath}`)
        sign(binPath, entitlementsPath)
      }
    }
  }

  // 3. Sign the .app bundle itself last
  console.log(`[afterPack] Signing app bundle: ${appPath}`)
  sign(appPath, entitlementsPath)
}

exports.default = async function (context) {
  if (context.electronPlatformName === 'win32') {
    // rcedit requires Wine when running on macOS/Linux (cross-compile).
    // On a native Windows build host it works directly. Gracefully skip if unavailable.
    const exeName = context.packager.appInfo.productFilename + '.exe'
    const exePath = path.join(context.appOutDir, exeName)

    console.log(`[afterPack] Patching version info for ${exeName}`)

    try {
      const { rcedit } = await import('rcedit')
      await rcedit(exePath, {
        'version-string': {
          FileDescription: 'Meeting Notes',
          ProductName: 'Meeting Notes',
          CompanyName: 'innogarage.ai',
          LegalCopyright: 'Copyright innogarage.ai. All rights reserved.',
          InternalName: 'meeting-notes',
          OriginalFilename: 'meeting-notes.exe'
        }
      })
      console.log('[afterPack] Version info patched successfully')
    } catch (err) {
      console.warn(`[afterPack] rcedit skipped: ${err.message}`)
      console.warn('[afterPack] Tip: on macOS/Linux install Wine to enable EXE metadata patching.')
      console.warn('[afterPack] The app will still work — Task Manager will show default EXE info.')
    }
  } else if (context.electronPlatformName === 'darwin') {
    const appName = context.packager.appInfo.productFilename + '.app'
    const appPath = path.join(context.appOutDir, appName)
    const entitlementsPath = path.join(__dirname, 'entitlements.mac.plist')
    console.log(`[afterPack] Starting inside-out ad-hoc codesign for: ${appPath}`)
    signAppInsideOut(appPath, entitlementsPath)
    console.log('[afterPack] Ad-hoc codesign complete')
  }
}
