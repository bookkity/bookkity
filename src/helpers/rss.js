import fs from "fs";
import RSS from "rss";

export default async function generateRssFeed(allArticles, allSeries) {
    const site_url =
        process.env.NODE_ENV === "production"
            ? "https://bookkity.com"
            : "http://localhost:3000";

    const feedOptions = {
        title: "Bookkity | RSS Feed",
        description: "Articles & Series",
        site_url: site_url,
        feed_url: `${site_url}/rss.xml`,
        image_url: `${site_url}/images/boo.png`,
        pubDate: new Date(),
        copyright: `All rights reserved ${new Date().getFullYear()}`,
    };

    const feed = new RSS(feedOptions);

    const articleItems = allArticles
        .filter(article => !article.url.startsWith('_')) // hidden articles
        .map(article => ({
            title: article.title,
            url: `${site_url}/article/${article.url}`,
            date: article.date,
            type: 'article'
        }));

    const chapterItems = allSeries.flatMap(series =>
        series.chapters
            .filter(chapter => chapter.published && chapter.listed)
            .map(chapter => ({
                title: `${series.details.title}: ${chapter.shortTitle}`,
                url: `${site_url}/series/${series.details.url}/${chapter.order}`,
                date: chapter.date,
                type: 'chapter'
            }))
    );

    const allItems = [...articleItems, ...chapterItems]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    allItems.forEach((item) => {
        feed.item({
            title: item.title,
            url: item.url,
            date: item.date,
        });
    });

    fs.writeFileSync("./public/rss.xml", feed.xml({ indent: true }));
}
