import fs from 'fs'
import path from 'path'

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} url
 * @property {boolean} featured
 * @property {Array<string>} tags
 */

/**
 * @returns {Promise<Array<Project>>}
 */
export async function getProjects() {
  const projectsDirectory = path.join(process.cwd(), 'projects')
  const projectsData = fs.readFileSync(path.join(projectsDirectory, 'projects.json'), 'utf8')
  return JSON.parse(projectsData)
}

export async function getProject(id) {
  const projects = await getProjects()
  return projects.find(project => project.id === id)
}
