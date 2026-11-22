import Image from 'next/image'
import sizes from '@/generated/image-sizes.json'

export default function ContentImage({src, alt = '', width, height, style, ...props}) {
  const dimensions = sizes[src?.replace(/\/{2,}/g, '/')]
  const cssWidth = typeof width === 'string' && width.endsWith('%') ? width : undefined
  const cssHeight = typeof height === 'string' && height.endsWith('%') ? height : undefined
  return <Image {...props} src={src} alt={alt} unoptimized
    width={cssWidth ? dimensions?.[0] : width ?? dimensions?.[0]}
    height={cssHeight ? dimensions?.[1] : height ?? dimensions?.[1]}
    style={{...(cssWidth && {width: cssWidth}), ...(cssHeight && {height: cssHeight}), ...style}} />
}
