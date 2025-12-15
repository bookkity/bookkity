import fs from 'fs'
import path from 'path'

const merchDirectory = path.join(process.cwd(), 'merch')

export async function getMerchItems() {
  const filePath = path.join(merchDirectory, 'merch.json')
  const fileContents = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(fileContents)
}

export async function getMerchItem(id) {
  const items = await getMerchItems()
  return items.find(item => item.id === id)
}
