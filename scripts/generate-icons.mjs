import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background: ink #0F0E0D
  ctx.fillStyle = '#0F0E0D'
  ctx.fillRect(0, 0, size, size)

  // Rounded rect clip (rounded corners ~18% of size)
  const radius = size * 0.18
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.lineTo(size - radius, 0)
  ctx.arcTo(size, 0, size, radius, radius)
  ctx.lineTo(size, size - radius)
  ctx.arcTo(size, size, size - radius, size, radius)
  ctx.lineTo(radius, size)
  ctx.arcTo(0, size, 0, size - radius, radius)
  ctx.lineTo(0, radius)
  ctx.arcTo(0, 0, radius, 0, radius)
  ctx.closePath()
  ctx.clip()

  // Re-fill background after clip
  ctx.fillStyle = '#0F0E0D'
  ctx.fillRect(0, 0, size, size)

  // Gold "M" letter — Fraunces-style serif fallback
  const fontSize = size * 0.52
  ctx.fillStyle = '#C8923A'
  ctx.font = `bold ${fontSize}px Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('M', size / 2, size / 2 + size * 0.03)

  // Gold dot bottom-right (brand accent)
  const dotR = size * 0.06
  ctx.beginPath()
  ctx.arc(size * 0.72, size * 0.72, dotR, 0, Math.PI * 2)
  ctx.fillStyle = '#C8923A'
  ctx.fill()

  return canvas.toBuffer('image/png')
}

const sizes = [192, 512]
for (const size of sizes) {
  const buf  = generateIcon(size)
  const dest = join(__dirname, '..', 'public', `icon-${size}.png`)
  writeFileSync(dest, buf)
  console.log(`✅ Generated icon-${size}.png`)
}

console.log('🎉 Icons ready in public/')
