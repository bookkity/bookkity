import fs from 'fs'
import path from 'path'

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} link
 * @property {boolean} featured
 * @property {Array<string>} tags
 */

/**
 * @returns {Promise<Array<Project>>}
 */
export async function getProjects() {
  const projectsDirectory = path.join(process.cwd(), 'projects')
  const projectsData = fs.readFileSync(path.join(projectsDirectory, 'projects.json'), 'utf8')
  const projects = JSON.parse(projectsData)

  return projects.map(project => ({
    ...project,
    // Add any additional processing here if needed
  }))
}

export async function getProject(id) {
  const projects = await getProjects()
  return projects.find(project => project.id === id)
}

export async function getFeaturedProjects() {
  const projects = await getProjects()
  return projects.filter(project => project.featured)
}


