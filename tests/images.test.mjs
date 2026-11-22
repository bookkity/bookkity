import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import {buildImageSizes} from '../scripts/build-image-sizes.mjs'

test('image dimensions follow public asset additions and deletions', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'bookkity-images-'))
  try {
    await fs.mkdir(path.join(root, 'public'))
    await sharp({create: {width: 80, height: 40, channels: 3, background: 'white'}})
      .png().toFile(path.join(root, 'public', 'example.png'))
    const output = path.join(root, 'src/generated/image-sizes.json')
    await buildImageSizes(root)
    assert.deepEqual(JSON.parse(await fs.readFile(output)), {'/example.png': [80, 40]})
    const modified = (await fs.stat(output)).mtimeMs
    await buildImageSizes(root)
    assert.equal((await fs.stat(output)).mtimeMs, modified)
    await fs.unlink(path.join(root, 'public', 'example.png'))
    await buildImageSizes(root)
    assert.deepEqual(JSON.parse(await fs.readFile(output)), {})
  } finally { await fs.rm(root, {recursive: true, force: true}) }
})
