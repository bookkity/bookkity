import fs from "fs";
import RSS from "rss";

export default async function generateRssFeed(allArticles) {
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

    allArticles
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach((article) => {
            feed.item({
                title: article.title,
                url: `${site_url}/article/${article.url}`,
                date: article.date,
            });
        });

    fs.writeFileSync("./public/rss.xml", feed.xml({ indent: true }));
}
