import { NodeIO } from '@gltf-transform/core'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modelsDir = path.join(__dirname, '../public/models')

// Target: longest real-world dimension in meters
const TARGETS = {
  'Burger.glb':              0.12,
  'Cheeseburger.glb':        0.12,
  'Double Cheeseburger.glb': 0.14,
  'Pizza.glb':               0.28,
  'Fries.glb':               0.10,
  'Hotdog.glb':              0.15,
  'Steak.glb':               0.22,
  'Chicken Leg.glb':         0.12,
  'Sushi.glb':               0.08,
  'Ice Cream.glb':           0.10,
  'Donut.glb':               0.10,
  'Pancakes Stack.glb':      0.12,
}

const io = new NodeIO()

for (const [filename, targetMeters] of Object.entries(TARGETS)) {
  const filePath = path.join(modelsDir, filename)

  try {
    const doc = await io.read(filePath)
    const root = doc.getRoot()
    const scene = root.listScenes()[0]
    if (!scene) { console.log(`⚠ ${filename}: no scene`); continue }

    // Step 1: Bake all accumulated node scales directly into vertex positions
    // This flattens the scene graph scale so we work with real-world units
    function bakeScales(node, parentScale) {
      const [sx, sy, sz] = node.getScale()
      const ws = [parentScale[0] * sx, parentScale[1] * sy, parentScale[2] * sz]

      const mesh = node.getMesh()
      if (mesh) {
        for (const prim of mesh.listPrimitives()) {
          const pos = prim.getAttribute('POSITION')
          if (!pos) continue
          const arr = pos.getArray()
          const out = new Float32Array(arr.length)
          for (let i = 0; i < arr.length; i += 3) {
            out[i]   = arr[i]   * ws[0]
            out[i+1] = arr[i+1] * ws[1]
            out[i+2] = arr[i+2] * ws[2]
          }
          pos.setArray(out)
        }
      }
      node.setScale([1, 1, 1])

      for (const child of node.listChildren()) {
        bakeScales(child, ws)
      }
    }
    for (const node of scene.listChildren()) bakeScales(node, [1, 1, 1])

    // Step 2: Compute bounding box from vertex positions (now world-space)
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute('POSITION')
        if (!pos) continue
        const arr = pos.getArray()
        for (let i = 0; i < arr.length; i += 3) {
          if (arr[i]   < minX) minX = arr[i]
          if (arr[i+1] < minY) minY = arr[i+1]
          if (arr[i+2] < minZ) minZ = arr[i+2]
          if (arr[i]   > maxX) maxX = arr[i]
          if (arr[i+1] > maxY) maxY = arr[i+1]
          if (arr[i+2] > maxZ) maxZ = arr[i+2]
        }
      }
    }

    const longest = Math.max(maxX - minX, maxY - minY, maxZ - minZ)
    if (longest === 0) { console.log(`⚠ ${filename}: empty geometry`); continue }

    console.log(`${filename}: world size = ${(longest * 100).toFixed(1)}cm → target ${targetMeters * 100}cm`)

    // Step 3: Scale all vertex positions to target size
    const scale = targetMeters / longest
    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute('POSITION')
        if (!pos) continue
        const arr = pos.getArray()
        const out = new Float32Array(arr.length)
        for (let i = 0; i < arr.length; i++) out[i] = arr[i] * scale
        pos.setArray(out)
      }
    }

    await io.write(filePath, doc)
    console.log(`✓ saved\n`)
  } catch (err) {
    console.error(`✗ ${filename}: ${err.message}\n`)
  }
}

console.log('All models rescaled to real-world AR dimensions.')
