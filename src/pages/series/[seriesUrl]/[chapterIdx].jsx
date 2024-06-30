import Head from "next/head";
import Layout from "@/components/Layout";
import {getSeries} from "@/helpers/series";
import {MDXRemote} from "next-mdx-remote";
import MDX from "@/components/mdx/MdxComponents";

export async function getStaticPaths() {
    const allSeries = await getSeries()

    return ({
        paths:
            allSeries
                .flatMap(series => {
                    return series.chapters.map(chapter => ({ series, chapter }))
                })
                .map(({ series, chapter }) => {
                    return {
                        params: {
                            seriesUrl: series.details.url,
                            chapterIdx: chapter.order.toString()
                        }
                    }
                }),
        fallback: false
    })
}

export async function getStaticProps({ params: { seriesUrl, chapterIdx } }) {
    const allSeries = await getSeries()
    const series = allSeries.find(it => it.details.url === seriesUrl)
    const chapter = series.chapters.find(it => it.order === parseInt(chapterIdx))

    return {
        props: {
            series,
            chapter
        }
    }
}

export default function ChapterIdx({ series, chapter }) {
    return (
        <>
            <Head>
                <title>Bookkity - Series</title>
            </Head>
            <Layout>
                <div className={`flex pt-6`}>
                    <div className={`flex flex-col max-w-64 b-1 b-r border-gray-100 font-semibold text-sm`}>
                        {series.chapters.map((chapter, idx) => {
                            return (
                                <div key={idx} className={`flex py-2 text-gray-700`}>
                                    <div className={`flex`}>
                                        <a href={`/series/${series.details.url}/${chapter.order}`} className={`hover:underline hover:text-gray-500`}>
                                            {chapter.title}
                                        </a>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className={``}>
                        <MDXRemote components={MDX} {...chapter.content} />
                    </div>
                </div>
            </Layout>
        </>
    )
}