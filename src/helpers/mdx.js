import {serialize} from "next-mdx-remote/serialize"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import rehypePrettyCode from "rehype-pretty-code"

export function serializeMdx(mdx) {
  return serialize(mdx, {
    mdxOptions: {
      remarkPlugins: [
        remarkGfm,
      ],
      rehypePlugins: [
        // rehypePrism,
        rehypeSlug,
        [rehypePrettyCode, { theme: "min-light"}],
        // rehypeAutolinkHeadings
      ]
    }
  })
}
