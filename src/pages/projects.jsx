import Layout from "@/components/Layout"
import Head from "next/head"
import { getProjects } from "@/helpers/projects"
import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSearch, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons"
import { Toggle } from "@/components/ui/toggle"

export async function getStaticProps() {
  const projects = await getProjects()
  return {
    props: {
      projects
    }
  }
}
function ProjectCard({ project }) {
  const isExternalUrl = project.url.startsWith('http')
  const linkUrl = isExternalUrl ? project.url : `/project/${project.id}`

  const cardContent = (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
      <div className="relative">
        <img
          src={project.image || '/images/boo.png'}
          alt={project.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = '/images/boo.png'
          }}
        />
        {isExternalUrl && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded-full">
            <FontAwesomeIcon icon={faExternalLinkAlt} size="sm" />
          </div>
        )}
        {project.featured && (
          <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
            Featured
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
          {project.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            by {project.authors.join(', ')}
          </div>
          <div className="text-sm text-blue-600 font-medium">
            {isExternalUrl ? 'View Project →' : 'Learn More →'}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <a
      href={linkUrl}
      target={isExternalUrl ? "_blank" : "_self"}
      rel={isExternalUrl ? "noopener noreferrer" : ""}
      className="block cursor-pointer hover:scale-[1.02] transition-transform duration-200"
    >
      {cardContent}
    </a>
  )
}
export default function Projects({ projects }) {
  const [search, setSearch] = useState('')

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = search === '' || 
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))

      return matchesSearch
    })
  }, [projects, search])

  const products = filteredProjects.filter(project => project.category === 'product')
  const libraries = filteredProjects.filter(project => project.category === 'library')
  return (
    <>
      <Head>
        <title>Bookkity - Community Projects</title>
        <meta name="description" content="Discover amazing projects created by our community members" />
      </Head>
      <Layout>
        <div className="pt-6 px-4">
          <div className="w-full px-4 py-6 bg-white rounded-lg mb-6">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Community Projects
            </h1>
            <p className="text-center text-gray-600">
              Discover amazing projects created by our community members. From open-source tools to innovative solutions.
            </p>
          </div>
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
              />
            </div>

          </div>

          {/* Products Section */}
          {products.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="bg-purple-600 w-1 h-8 rounded mr-3"></span>
                Products
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          {/* Libraries Section */}
          {libraries.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="bg-blue-600 w-1 h-8 rounded mr-3"></span>
                Libraries
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {libraries.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No projects found matching your criteria.
              </p>
            </div>
          )}
        </div>
      </Layout>
    </>
  )
}
