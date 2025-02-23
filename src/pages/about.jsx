import Layout from "@/components/Layout"
import Head from "next/head"
import {getAuthors} from "@/helpers/authors"

export async function getStaticProps() {
  const authors = await getAuthors()

  return {
    props: {
      authors
    }
  }
}

export default function About({ authors }) {
  return (
    <>
      <Head>
        <title>Bookkity - About Us</title>
      </Head>
      <Layout>
        <div className={`pt-6 px-4`}>
          <div className={`w-full px-4 py-6 bg-white rounded-lg`}>
            <p className={`text-center`}>
              Welcome to <span className={`text-purple-600`}>Bookkity</span> community, where a group of long-time friends come together to share their thoughts on tech related topics.
              <br/>
              Our journey began years ago, but so much more is still ahead of us.
            </p>
          </div>
        </div>
        <div>
          <div className={`flex flex-wrap mt-4`}>
            {authors.map((author, index) => (
              <div key={index}
                   className={`w-full md:w-1/2 lg:w-1/3 xl:w-1/4 p-4 cursor-pointer hover:scale-[1.02] hover:duration-200`}
              >
                <div className={`bg-white rounded-lg flex flex-col relative`}>
                  <a href={`/${author.name}`}>
                    <div className={`w-full bg-gray-200 h-20 rounded-t-lg`}></div>
                    <img
                      src={`/author/${author.avatar}`}
                      alt={author.name}
                      className={`absolute mx-auto rounded-full w-28 top-4 left-1/2 -ml-14 border border-black bg-white`}
                    />
                    <div className={`flex flex-col items-center px-2 pt-10 pb-8`}>
                      <h3 className={`text-lg font-semibold mt-4`}>{author.name}</h3>
                      <p className={`text-gray-600 text-sm mt-2`}>{author.description}</p>
                    </div>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    </>
  )
}
