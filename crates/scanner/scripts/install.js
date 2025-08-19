#!/usr/bin/env node

/**
 * @sugarcube-org/scanner postinstall script
 *
 * This script ensures that the correct binary for the current platform and
 * architecture is downloaded and available.
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const { extract } = require('tar')
const packageJson = require('../package.json')
const detectLibc = require('detect-libc')

const version = packageJson.version

function getPlatformPackageName() {
  let platform = process.platform
  let arch = process.arch

  let libc = ''
  if (platform === 'linux') {
    libc = detectLibc.isNonGlibcLinuxSync() ? 'musl' : 'gnu'
  }

  // Map to our package naming conventions
  switch (platform) {
    case 'darwin':
      return arch === 'arm64' ? '@sugarcube-org/scanner-darwin-arm64' : '@sugarcube-org/scanner-darwin-x64'
    case 'win32':
      if (arch === 'arm64') return '@sugarcube-org/scanner-win32-arm64-msvc'
      if (arch === 'ia32') return '@sugarcube-org/scanner-win32-ia32-msvc'
      return '@sugarcube-org/scanner-win32-x64-msvc'
    case 'linux':
      if (arch === 'x64') {
        return libc === 'musl'
          ? '@sugarcube-org/scanner-linux-x64-musl'
          : '@sugarcube-org/scanner-linux-x64-gnu'
      } else if (arch === 'arm64') {
        return libc === 'musl'
          ? '@sugarcube-org/scanner-linux-arm64-musl'
          : '@sugarcube-org/scanner-linux-arm64-gnu'
      } else if (arch === 'arm') {
        return '@sugarcube-org/scanner-linux-arm-gnueabihf'
      }
      break
    case 'freebsd':
      return '@sugarcube-org/scanner-freebsd-x64'
    case 'android':
      return '@sugarcube-org/scanner-android-arm64'
    default:
      return '@sugarcube-org/scanner-wasm32-wasi'
  }
}

function isPackageAvailable(packageName) {
  try {
    require.resolve(packageName)
    return true
  } catch (e) {
    return false
  }
}

// Extract all files from a tarball to a destination directory
async function extractTarball(tarballStream, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  return new Promise((resolve, reject) => {
    tarballStream
      .pipe(extract({ cwd: destDir, strip: 1 }))
      .on('error', (err) => reject(err))
      .on('end', () => resolve())
  })
}

async function downloadAndExtractBinary(packageName) {
  let tarballUrl = `https://registry.npmjs.org/${packageName}/-/${packageName.replace('@sugarcube-org/', '')}-${version}.tgz`
  console.log(`Downloading ${tarballUrl}...`)

  return new Promise((resolve) => {
    https
      .get(tarballUrl, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirects
          https.get(response.headers.location, handleResponse).on('error', (err) => {
            console.error('Download error:', err)
            resolve()
          })
          return
        }

        handleResponse(response)

        async function handleResponse(response) {
          try {
            if (response.statusCode !== 200) {
              throw new Error(`Download failed with status code: ${response.statusCode}`)
            }

            await extractTarball(
              response,
              path.join(__dirname, '..', 'node_modules', ...packageName.split('/')),
            )
            console.log(`Successfully downloaded and installed ${packageName}`)
          } catch (error) {
            console.error('Error during extraction:', error)
            resolve()
          } finally {
            resolve()
          }
        }
      })
      .on('error', (err) => {
        console.error('Download error:', err)
        resolve()
      })
  })
}

async function main() {
  // Don't run this script in the package source
  try {
    if (fs.existsSync(path.join(__dirname, '..', 'build.rs'))) {
      return
    }

    let packageName = getPlatformPackageName()
    if (!packageName) return
    if (isPackageAvailable(packageName)) return

    await downloadAndExtractBinary(packageName)
  } catch (error) {
    console.error(error)
    return
  }
}

main()
