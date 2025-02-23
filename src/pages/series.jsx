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

export default function Series({series}) {
  return (
    <>
      <Head>
        <title>Bookkity - Series</title>
      </Head>
      <Layout>
        <div className={'flex flex-col w-full'}>
          {series.map(({details, chapters}, index) => {
            const firstChapterUrl = `/series/${details.url}/1`

            return (
              <div key={index} className={`w-full pt-6 px-4`}>
                <div className={
                  `flex flex-col lg:flex-row lg:max-h-52 w-full bg-white rounded-lg cursor-pointer hover:scale-[1.02] hover:duration-200`
                }>
                  <a href={firstChapterUrl} className={`w-full lg:w-96 h-52`}>
                    <img
                      src={`/series/${details.image}`}
                      alt={details.title}
                      className={`bg-white rounded-l-lg h-full object-cover w-full`}
                    />
                  </a>
                  <div className={`flex flex-1 flex-col px-4 py-2`}>
                    <div>
                      <a href={firstChapterUrl}>
                        <h2 className={`text-2xl px-2 pt-1 rounded-md font-semibold`}>
                          {details.title}
                        </h2>
                      </a>
                      <div className={`px-2 text-sm flex`}>
                        <div>by&nbsp;</div>
                        {details.authors.map((author, idx) => (
                          <div>
                            {idx > 0 && ', '}
                            <a key={idx} href={`/${author}`} className={'text-purple-700'}>
                              {author}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`h-full flex px-2 py-2 rounded-md mt-2 w-full`}>
                      <div className={`flex justify-between w-full`}>
                        <p className={`text-gray-500 w-2/5 min-w-2/5 text-sm`}>
                          <a href={firstChapterUrl}>
                            {details.description ?? ' '}
                          </a>
                        </p>
                        <div className={`flex flex-1 flex-col pl-10 pr-4 -mt-6`}>
                          <p className={`text-gray-400 font-semibold text-xs`}>
                            Chapters
                          </p>
                          {chapters.map((chapter, idx) => (
                            <div key={idx} className={`flex flex-col mt-2`}>
                              <a href={`/series/${details.url}/${chapter.order}`}>
                                <p className={`text-purple-700 text-sm`}>{idx + 1}. {chapter.shortTitle}</p>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Layout>
    </>
  )
}
