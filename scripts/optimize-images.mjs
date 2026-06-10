import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import { join, extname, basename } from 'path'

const DIR     = 'public/images'
const MAX_W   = 1920
const QUALITY = 80
const SKIP    = ['icon-color.png', 'icon-white.png', 'logo-color.png', 'logo-white.png']

const files = (await readdir(DIR)).filter(f => {
  const ext = extname(f).toLowerCase()
  return (ext === '.jpg' || ext === '.jpeg' || ext === '.png') && !SKIP.includes(f)
})

let totalBefore = 0
let totalAfter  = 0

console.log('\n  Fichier                    Avant      Après      Gain    WebP')
console.log('  ' + '─'.repeat(70))

for (const file of files) {
  const src  = join(DIR, file)
  const name = basename(file, extname(file))
  const dst  = join(DIR, file)
  const dstW = join(DIR, name + '.webp')

  const before = (await stat(src)).size

  const pipeline = sharp(src).resize({ width: MAX_W, withoutEnlargement: true })

  const ext = extname(file).toLowerCase()
  if (ext === '.png') {
    await pipeline.clone().png({ quality: QUALITY, compressionLevel: 9 }).toFile(dst + '.tmp')
  } else {
    await pipeline.clone().jpeg({ quality: QUALITY, mozjpeg: true }).toFile(dst + '.tmp')
  }
  await pipeline.clone().webp({ quality: QUALITY }).toFile(dstW)

  const { rename } = await import('fs/promises')
  await rename(dst + '.tmp', dst)

  const after    = (await stat(dst)).size
  const afterW   = (await stat(dstW)).size
  const gainPct  = (((before - after) / before) * 100).toFixed(0)

  const kb  = n => String(Math.round(n / 1024)).padStart(6) + ' Ko'
  const pad = s => s.padEnd(24)

  console.log(`  ${pad(file)}  ${kb(before)}  ${kb(after)}  -${String(gainPct).padStart(3)}%   ${kb(afterW)}`)

  totalBefore += before
  totalAfter  += after
}

const gainTotal = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(0)
console.log('  ' + '─'.repeat(70))
console.log(`  ${'TOTAL'.padEnd(24)}  ${(totalBefore / 1024 / 1024).toFixed(1)} Mo   ${(totalAfter / 1024 / 1024).toFixed(1)} Mo  -${gainTotal}%\n`)
