import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
let root = path.resolve(__dirname, '..')
const scannerRoot = path.join(root)

// Move napi artifacts into sub packages
for (let file of await fs.readdir(scannerRoot)) {
  if (file.startsWith('scanner.') && file.endsWith('.node')) {
    let target = file.split('.')[1]
    await fs.cp(
      path.join(scannerRoot, file),
      path.join(scannerRoot, 'npm', target, file),
    )
    console.log(`Moved ${file} to npm/${target}`)
  }
}

// Move napi wasm artifacts into sub package
let wasmArtifacts = {
  'scanner.debug.wasm': 'scanner.wasm32-wasi.debug.wasm',
  'scanner.wasm': 'scanner.wasm32-wasi.wasm',
  'scanner.wasi-browser.js': 'scanner.wasi-browser.js',
  'scanner.wasi.cjs': 'scanner.wasi.cjs',
  'wasi-worker-browser.mjs': 'wasi-worker-browser.mjs',
  'wasi-worker.mjs': 'wasi-worker.mjs',
}
for (let file of await fs.readdir(scannerRoot)) {
  if (!wasmArtifacts[file]) continue
  await fs.cp(
    path.join(scannerRoot, file),
    path.join(scannerRoot, 'npm', 'wasm32-wasi', wasmArtifacts[file]),
  )
  console.log(`Moved ${file} to npm/wasm32-wasi`)
}
