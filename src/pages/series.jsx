import Head from "next/head"
import {getSeries} from "@/helpers/series"
import Layout from "@/components/Layout"

export async function getStaticProps() {
  const series = await getSeries()

  return {
    props: {
      series
    }
  }
}

export default function Series({ series }) {
  return (
    <>
      <Head>
        <title>Bookkity - Series</title>
      </Head>
      <Layout>
        <div className={'flex flex-col w-full'}>
          {series.map(({details, chapters}, index) => (
            <div key={index} className={`w-full pt-6 px-4`}>
              <div className={`flex flex-col lg:flex-row lg:max-h-52 w-full bg-white rounded-lg`}>
                <img
                  src={`/series/${details.path}/${details.image}`}
                  alt={details.title}
                  className={`bg-white rounded-l-lg lg:w-96 h-52 ,ax object-cover`}
                />
                <div className={`flex flex-1 flex-col px-4 py-2`}>
                  <div>
                    <h2 className={`text-2xl px-2 pt-1 rounded-md font-semibold`}>
                      {details.title}
                    </h2>
                    <p className={`px-2 text-sm text-purple-700`}>
                      by <a href={`/${details.authors}`}>{details.authors}</a>
                    </p>
                  </div>
                  <div className={`h-full flex px-2 py-2 rounded-md mt-2 w-full`}>
                  <div className={`flex justify-between`}>
                      <p className={`text-gray-500 w-2/5 text-sm`}>
                        {details.description}
                      </p>
                      <div className={`flex flex-1 flex-col pl-10 pr-4 -mt-6`}>
                        <p className={`text-gray-400 font-semibold text-xs`}>
                          Chapters
                        </p>
                        {chapters.map((chapter, idx) => (
                          <div key={idx} className={`flex flex-col mt-2`}>
                            <a href={`/series/${details.path}/${chapter.url}`}>
                              <p className={`text-purple-700 text-sm`}>{idx + 1}. {chapter.title}</p>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Layout>
    </>
  )
}
