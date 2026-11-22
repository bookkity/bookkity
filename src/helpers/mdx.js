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

function wrapDisplayMath() {
  return function visit(node) {
    if (!node.children) return
    node.children = node.children.map(child => {
      if (child.type === 'element' && child.properties?.className?.includes('katex-display')) {
        const html = child.children[0].children.find(element => element.properties?.className?.includes('katex-html'))
        const tag = html.children.find(element => element.properties?.className?.includes('katex-tag'))
        if (tag) {
          // Keep operator spacing and explicit line breaks inside the formula intact.
          html.children = [
            {type: 'element', tagName: 'span', properties: {className: ['math-equation']}, children: html.children.filter(element => element !== tag)},
            tag,
          ]
        }
        return {type: 'element', tagName: 'math-block', properties: {}, children: [child]}
      }
      visit(child)
      return child
    })
  }
}

function rejectInvalidMath() {
  return (_tree, file) => {
    const error = file.messages.find(message => message.source === 'rehype-katex')
    if (error) {
      file.fail(`${file.path || 'MDX'}: ${error.reason}. ${error.cause?.message || ''}`, error.place)
    }
  }
}

export function serializeMdx(mdx, sourcePath) {
  return serialize({value: mdx, path: sourcePath}, {
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
        rejectInvalidMath,
        wrapDisplayMath,
        [rehypePrettyCode, { theme: "min-light"}],
      ]
    }
  })
}
