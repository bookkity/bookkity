import Layout from "@/components/Layout"
import Head from "next/head"
import {getProjects} from "@/helpers/projects"
import {useMemo, useState} from "react"

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
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group flex flex-col h-72">
      <div className="relative">
        <img
          src={project.image || '/images/boo.png'}
          alt={project.title}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = '/images/boo.png'
          }}
        />
        {project.featured && (
          <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
            Featured
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
          {project.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="px-5 py-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-gray-500 ml-2">
            by {project.authors.join(', ')}
          </p>
        </div>
        <p className="text-gray-600 text-sm flex-1">
          {project.description}
        </p>
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
      return search === '' ||
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    })
  }, [projects, search])

  // Use all projects instead of filtered when search is hidden
  const displayProjects = projects

  const products = displayProjects
    .filter(project => project.category === 'product')
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))

  const libraries = displayProjects
    .filter(project => project.category === 'library')
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))

  const research = displayProjects
    .filter(project => project.category === 'research')
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))

  return (
    <>
      <Head>
        <title>Bookkity - Community Projects</title>
        <meta name="description" content="Discover amazing projects created by our community members" />
      </Head>
      <Layout>
        <div className="pt-4 px-4">
          <div className="w-full px-4 py-6 bg-white rounded-lg mb-6">
            {/* <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Community Projects
            </h1> */}
            <p className="text-center text-sm text-gray-950">
              Discover amazing projects created by our community members. From open-source tools to innovative solutions.
            </p>
          </div>
          {/*
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
          */}

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

          {/* Research & Fun Section */}
          {research.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="bg-green-600 w-1 h-8 rounded mr-3"></span>
                Research & Fun
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {research.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          {displayProjects.length === 0 && (
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
