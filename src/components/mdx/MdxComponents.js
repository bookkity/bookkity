import React from "react"
import {
  ArrowUpRightFromSquareIcon,
  CircleAlertIcon,
  InfoIcon,
  LightbulbIcon,
  StarIcon,
  TriangleAlertIcon
} from "lucide-react";
import KhangulKeyboard from "@/components/mdx/KhangulKeyboard";
import {CodeVariant, CodeVariants} from "@/components/mdx/CodeVariants";

function getAnchor(text) {
  return text
      ?.toString()
      ?.toLowerCase()
      ?.replace(/[^a-z0-9 ]/g, '')
      ?.replace(/[ ]/g, '-')
      ?? ''
}

const H = ({ children, as, size }) => {
  const anchor = getAnchor(children)

  return React.createElement(
    as,
    {
      className: `py-2 -ml-${size.includes('xl') ? '4' : '3'} font-bold text-${size}`,
    },
    <a id={anchor} className={`paragraph`} href={`#${anchor}`}>
      <abbr className={`opacity-0.5 text-gray-400 font-normal opacity-0`}>§ </abbr>
      <span className={`hover:underline hover:decoration-gray-300`}>
        {children}
      </span>
    </a>
  )
}



// `text`
const Highlight = (props) => (
  <pre className={`px-2 text-xs bg-white rounded-lg whitespace-pre break-normal spacing`}>
    {props.children}
  </pre>
)

// ```text```
const Snippet = (props) => (
  <div
    // border="1px solid black"
    // background={'#282a36'}
    // marginY='4'
    // overflow='x-auto'
    // borderRadius='md'
    className={`border-1`}
  >
    <pre {...props} />
  </div>
)

const MdTable = (props) => {
  return (
    <div className={`px-0 py-0 my-4 max-w-full overflow-auto`}>
      <table className={`rounded-corners`} {...props} />
    </div>
  )
}

const TableHeader = (props) => {
  return <th className={`py-2 px-5`} {...props} />
}

const TableRow = (props) => {
  return <tr className={`bg-white`} {...props} />
}

const TableCell = (props) => {
  return <td className={`py-1.5 px-3 break-words`} {...props} />
}

const References = ({links}) => {
  return (
    <div className={`bg-gray-50 rounded-lg px-3 py-3 mb-3 flex items-center`}>
      <h3 className={`text-xs font-semibold pr-1`}>References</h3>
      <div className={`flex items-center`}>
          {links.map((link, idx) => (
            <div key={idx} className={`px-2 text-sm text-purple-800`}>
                <a href={link.url} className={`hover:underline hover:decoration-gray-300 flex items-center`} target={"_blank"}>
                  <ArrowUpRightFromSquareIcon size={14} />
                  <span className={`pl-1.5`}>
                    {link.title}
                  </span>
                </a>
            </div>
          ))}
      </div>
    </div>
  )
}

const alertTypes = {
  'note': {
    icon: <InfoIcon size={20} color={'rgb(96, 165, 250)'} />,
    border: 'border-blue-400'
  },
  'tip': {
    icon: <LightbulbIcon size={20} color={'rgb(234,189,20)'}/>,
    border: 'border-yellow-400'
  },
  'important': {
    icon: <StarIcon size={20} color={'rgb(192, 132, 252)'} />,
    border: 'border-purple-400',
  },
  'warning': {
    icon: <TriangleAlertIcon size={20} color={'rgb(251, 146, 60)'} />,
    border: 'border-orange-400',
  },
  'caution': {
    icon: <CircleAlertIcon size={20} color={'rgb(239, 68, 68)'} />,
    border: 'border-red-500',
  },
}

const Alert = ({type, children}) => {
  const { icon, border } = alertTypes[type]

  return (
    <div className={`${border} flex items-center border-l-4 pl-4 py-0.5 mt-2 mb-4 text-md bg-gray-50 rounded-r-md`}>
      <div className={`pl-0.5 pr-4`}>
        {icon}
      </div>
      <div>
        {children}
      </div>
    </div>
  )
}

export default {
  a: (props) => <a className={'text-purple-500'} {...props} />,
  p: (props) => <div className={'py-2'} {...props} />,
  h1: (props) => <H as='h1' size={'2xl'} {...props} />,
  h2: (props) => <H as='h2' size={'xl'} {...props} />,
  h3: (props) => <H as='h3' size={'lg'} {...props} />,
  h4: (props) => <H as='h4' size={'md'} {...props} />,
  h5: (props) => <H as='h5' size={'sm'} {...props} />,
  pre: Highlight,
  // code: Highlight,
  table: MdTable,
  thead: (props) => <thead className={``} {...props} />,
  tbody: (props) => <tbody {...props} />,
  tr: TableRow,
  th: TableHeader,
  td: TableCell,
  hr: (props) => <hr className={`border-gray-200 my-4`} {...props} />,
  ul: (props) => <ul className={`py-1 pl-5 list-disc`} {...props} />,
  ol: (props) => <ol className={`py-2 pl-8 list-decimal `} {...props} />,
  li: (props) => <li className={`py-0.5 pl-2`} {...props} />,
  img: (props) =>  <img className={`inline-block rounded-md -mb-1 mt-2`} {...props} />,
  blockquote: (props) => <blockquote className={`border-l-4 border-purple-200 py-0 pl-4 mt-2 mb-4 text-md bg-gray-50 rounded-r-md`} {...props} />,
  // Spoiler: (props) => <Spoiler {...props} />,
  CodeVariants: (props) => <CodeVariants {...props} />,
  CodeVariant: (props) => <CodeVariant {...props} />,
  AlignRight: (props) => <div className={`text-right`} {...props} />,
  KhangulKeyboard,
  Alert,
  Snippet,
  Highlight,
  References,
}
