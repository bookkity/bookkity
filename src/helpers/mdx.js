import {serialize} from "next-mdx-remote/serialize"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import rehypePrettyCode from "rehype-pretty-code"
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export function serializeMdx(mdx) {
  return serialize(mdx, {
    // Content comes from this repository, and component props like links={[...]} need JS expressions.
    // blockDangerousJS stays on (default) and still rejects eval, Function, process, require and similar.
    blockJS: false,
    mdxOptions: {
      remarkPlugins: [
        remarkGfm, remarkMath
      ],
      rehypePlugins: [
        // rehypePrism,
        rehypeSlug,
        rehypeKatex,
        [rehypePrettyCode, { theme: "min-light"}],
        // rehypeAutolinkHeadings
      ]
    }
  })
}
