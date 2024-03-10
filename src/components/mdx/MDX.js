import React from "react"

function getAnchor(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/[ ]/g, '-')
}

const H = ({ children, as, size }) => {
  const anchor = getAnchor(children)

  return React.createElement(
    as,
    {
      className: `py-2 font-bold text-${size}`,
    },
    <a className="paragraph -ml-4" href={`#${anchor}`}>
      <abbr className={`opacity-0.5 color-gray-300 font-normal`}>§ </abbr>
      <span className={`hover:underline hover:decoration-gray-400`}>
        {children}
      </span>
    </a>
  )
}

// const CodeVariant = ({ children, name }) => {
//   return (
//     <Box name={name}>
//       {children}
//     </Box>
//   )
// }

// const CodeVariants = ({ children }) => {
//   const [ bg, bgCss ] = useColorModeValue('code-variant-bg', chakraColor('gray.50'), chakraColor('gray.700'))
//   children = Array.isArray(children) ? children : [children]
//
//   return (
//     <>
//       <Tabs
//         variant='enclosed'
//         colorScheme={''}
//         marginTop={4}
//         marginBottom={4}
//         backgroundColor={bg}
//         borderRadius={'lg'}
//       >
//         <TabList>
//           {children.map(({ props }) => (
//             <Tab key={props.name}>{props.name}</Tab>
//           ))}
//         </TabList>
//         <TabPanels>
//           {children.map(variant => (
//             <TabPanel key={variant.props.name} paddingY={2} paddingX={6}>
//               {variant}
//             </TabPanel>
//           ))}
//         </TabPanels>
//       </Tabs>
//     </>
//   )
// }

// `text`
const Highlight = (props) => (
  <pre
    className={`px-2 text-xs bg-white rounded-full whitespace-pre break-normal spacing`}
    // fontSize={'xs'}
    // background='purple.100'
    // borderRadius={'full'}
    // whiteSpace={'pre'}
    // wordSpacing={'normal'}
    // wordBreak={'normal'}
    // paddingX='2'
    {...props}
  />
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
    <>
      <div
        paddingX='0'
        paddingY='0'
        border='1px'
        borderColor={borderColor}
        borderRadius='lg'
        marginY='4'
        maxWidth={'100vw'}
        overflow="auto"
      >
        <table
          variant={'simple'}
          size={'sm'}
          {...props}
        />
      </div>
    </>
  )
}

const TableHeader = (props) => {
  return (
    <>
      <th py={3} px={5} color={color} border={'none'} {...props} />
    </>
  )
}

const TableRow = (props) =>
  <tr borderRadius='lg' border={'none'} {...props} />

const TableCell = (props) => {
  return (
    <>
      <td
        py={2}
        px={{ base: 3, xl: 6 }}
        borderBottom={'none'}
        borderTop={'1px'}
        borderTopColor={borderColor}
        wordBreak={'break-word'}
        {...props}
      />
    </>
  )
}

export default {
  a: (props) => <a color={'purple.400'} {...props} />,
  p: (props) => <div className={'py-2'} {...props} />,
  h1: (props) => <H as='h1' size={'xl'}  {...props} />,
  h2: (props) => <H as='h2' size={'lg'} {...props} />,
  h3: (props) => <H as='h3' size={'md'} {...props} />,
  h4: (props) => <H as='h4' size={'sm'} {...props} />,
  h5: (props) => <H as='h5' size={'xs'} {...props} />,
  pre: Snippet,
  code: Highlight,
  table: MdTable,
  thead: (props) => <thead {...props} />,
  tbody: (props) => <tbody {...props} />,
  tr: TableRow,
  th: TableHeader,
  td: TableCell,
  ul: (props) => <ul className={`py-1 list-disc`} {...props} />,
  ol: (props) => <ol className={`py-2 list-decimal`} {...props} />,
  li: (props) => <li className={`py-0.5`} {...props} />,
  img: (props) =>  <img className={`inline-block rounded-md -mb-1`} {...props} />,
  // Spoiler: (props) => <Spoiler {...props} />,
  // CodeVariants: (props) => <CodeVariants {...props} />,
  // CodeVariant: (props) => <CodeVariant {...props} />,
  Snippet,
  Highlight
}
