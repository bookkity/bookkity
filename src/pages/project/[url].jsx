import {authorPath} from '@/helpers/author-path'
import ContentImage from "@/components/ContentImage"
import NextLink from "next/link"
import {getAuthors} from "@/helpers/authors"
import Layout from "@/components/Layout"
import Seo from "@/components/Seo"
import { getProjects, getProject } from "@/helpers/projects"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import { faGithub } from "@fortawesome/free-brands-svg-icons"

export async function getStaticPaths() {
  const projects = await getProjects()
  const internalProjects = projects.filter(project => !project.url.startsWith('http'))

  const paths = internalProjects.map(project => ({
    params: { url: project.id }
  }))

  return {
    paths,
    fallback: false
  }
}

export async function getStaticProps({ params }) {
  const project = await getProject(params.url)

  if (!project || project.url.startsWith('http')) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      project,
      authorNames: (await getAuthors()).map(author => author.name)
    }
  }
}

export default function ProjectPage({ project, authorNames }) {
  return (
    <>
      <Seo page={{kind: 'page', title: project.title, description: project.description, path: `/project/${project.id}`, image: project.image}} />
      <Layout>
        <div className="pt-6 px-4">
          <div className="mb-6">
            <NextLink prefetch={false}
              href="/projects"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors text-sm"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-1 w-3 h-3" />
              Back to Projects
            </NextLink>
          </div>
          <div className="bg-white rounded-lg p-8 mb-6">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/3">
                <ContentImage
                  src={project.image || '/images/boo.png'}
                  alt={project.title}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    e.target.src = '/images/boo.png'
                  }}
                />
              </div>
              <div className="lg:w-2/3">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {project.title}
                </h1>
                <p className="text-xl text-gray-600 mb-6">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Authors</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.authors.map((author, index) => (
                      <span key={index}>{authorNames.includes(author) ? <NextLink prefetch={false}
                        href={authorPath(author)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors"
                      >
                        {author}
                      </NextLink> : author}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  {project.githubUrl && (
                    <NextLink prefetch={false}
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <FontAwesomeIcon icon={faGithub} className="mr-2" />
                      View on GitHub
                    </NextLink>
                  )}
                  {project.demoUrl && (
                    <NextLink prefetch={false}
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Live Demo
                    </NextLink>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-8">
            <div className="prose max-w-none">
              
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
