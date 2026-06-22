import { NodeIO } from '@gltf-transform/core'
import { transformMesh } from '@gltf-transform/functions'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modelsDir = path.join(__dirname, '../public/models')

// Target: longest dimension of each model in meters (real-world size)
const TARGETS = {
  'Burger.glb':            0.12,   // 12cm burger
  'Cheeseburger.glb':      0.12,
  'Double Cheeseburger.glb': 0.14, // slightly bigger double
  'Pizza.glb':             0.28,   // 28cm pizza
  'Fries.glb':             0.10,   // 10cm tall fries box
  'Hotdog.glb':            0.15,   // 15cm hotdog
  'Steak.glb':             0.22,   // 22cm steak
  'Chicken Leg.glb':       0.12,
  'Sushi.glb':             0.08,   // 8cm sushi piece
  'Ice Cream.glb':         0.10,
  'Donut.glb':             0.10,
  'Pancakes Stack.glb':    0.12,
}

const io = new NodeIO()

for (const [filename, targetMeters] of Object.entries(TARGETS)) {
  const filePath = path.join(modelsDir, filename)

  try {
    const doc = await io.read(filePath)
    const root = doc.getRoot()

    // Compute bounding box across all meshes
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute('POSITION')
        if (!pos) continue
        for (let i = 0; i < pos.getCount(); i++) {
          const [x, y, z] = pos.getElement(i, [])
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (z < minZ) minZ = z
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
          if (z > maxZ) maxZ = z
        }
      }
    }

    const sizeX = maxX - minX
    const sizeY = maxY - minY
    const sizeZ = maxZ - minZ
    const longestSide = Math.max(sizeX, sizeY, sizeZ)

    if (longestSide === 0) {
      console.log(`⚠ ${filename}: could not compute bounding box, skipping`)
      continue
    }

    const scaleFactor = targetMeters / longestSide
    console.log(`${filename}: longest side = ${longestSide.toFixed(4)} units → scale × ${scaleFactor.toFixed(4)} → ${targetMeters * 100}cm`)

    // Apply scale to all scene nodes at root level
    const scene = root.listScenes()[0]
    if (!scene) {
      console.log(`⚠ ${filename}: no scene found`)
      continue
    }

    for (const node of scene.listChildren()) {
      const current = node.getScale()
      node.setScale([
        current[0] * scaleFactor,
        current[1] * scaleFactor,
        current[2] * scaleFactor,
      ])
    }

    await io.write(filePath, doc)
    console.log(`✓ ${filename} rescaled and saved\n`)
  } catch (err) {
    console.error(`✗ ${filename}: ${err.message}\n`)
  }
}

console.log('Done. All models rescaled to real-world AR dimensions.')
