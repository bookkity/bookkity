import {serialize} from "next-mdx-remote/serialize"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import rehypePrettyCode from "rehype-pretty-code"
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Explicit JSX tags in MDX bypass the normal Markdown image component mapping.
function mapJsxImages() {
  return function visit(node) {
    if (['mdxJsxFlowElement', 'mdxJsxTextElement'].includes(node.type) && node.name === 'img') {
      node.name = 'ContentImage'
    }
    node.children?.forEach(visit)
  }
}

export function serializeMdx(mdx) {
  return serialize(mdx, {
    // Content comes from this repository, and component props like links={[...]} need JS expressions.
    // blockDangerousJS stays on (default) and still rejects eval, Function, process, require and similar.
    blockJS: false,
    mdxOptions: {
      remarkPlugins: [
        remarkGfm, remarkMath, mapJsxImages
      ],
      rehypePlugins: [
        rehypeSlug,
        rehypeKatex,
        [rehypePrettyCode, { theme: "min-light"}],
      ]
    }
  })
}
