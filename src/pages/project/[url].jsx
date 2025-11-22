import Layout from "@/components/Layout"
import Head from "next/head"
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
      project
    }
  }
}

export default function ProjectPage({ project }) {
  return (
    <>
      <Head>
        <title>{project.title} - Bookkity Projects</title>
        <meta name="description" content={project.description} />
      </Head>
      <Layout>
        <div className="pt-6 px-4">
          {/* Back Button */}
          <div className="mb-6">
            <a
              href="/projects"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Projects
            </a>
          </div>

          {/* Project Header */}
          <div className="bg-white rounded-lg p-8 mb-6">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/3">
                <img
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

                {/* Tags */}
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

                {/* Authors */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Authors</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.authors.map((author, index) => (
                      <a
                        key={index}
                        href={`/${author}`}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors"
                      >
                        {author}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <FontAwesomeIcon icon={faGithub} className="mr-2" />
                      View on GitHub
                    </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Project Content */}
          <div className="bg-white rounded-lg p-8">
            <div className="prose max-w-none">
              <h2>About this Project</h2>
              <p>
                This is a placeholder content area for the internal project page.
                In a real implementation, you would likely load this content from
                markdown files or a CMS, similar to how articles and series work.
              </p>

              <h3>Features</h3>
              <ul>
                <li>Feature 1 description</li>
                <li>Feature 2 description</li>
                <li>Feature 3 description</li>
              </ul>

              <h3>Getting Started</h3>
              <p>
                Instructions on how to get started with this project would go here.
                You could include code examples, installation steps, or usage examples.
              </p>

              <h3>Contributing</h3>
              <p>
                Information about how community members can contribute to this project.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
