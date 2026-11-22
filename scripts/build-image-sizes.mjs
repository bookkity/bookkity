import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

// Public images keep their existing URLs; dimensions reserve space before loading.
export async function buildImageSizes(root = process.cwd()) {
  const sizes = {}
  const publicDir = path.join(root, 'public')
  for (const file of (await fs.readdir(publicDir, {recursive: true})).sort()) {
    if (!/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(file)) continue
    const {width, height, orientation} = await sharp(path.join(publicDir, file)).metadata()
    sizes[`/${file.split(path.sep).join('/')}`] = orientation >= 5 ? [height, width] : [width, height]
  }
  const output = path.join(root, 'src/generated/image-sizes.json')
  const json = JSON.stringify(sizes) + '\n'
  if (await fs.readFile(output, 'utf8').catch(() => null) === json) return
  await fs.mkdir(path.dirname(output), {recursive: true})
  await fs.writeFile(output, json)
}
