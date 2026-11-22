import Image from 'next/image'
import sizes from '@/generated/image-sizes.json'
import {IMAGE_SHIMMER} from '@/helpers/image-placeholder.mjs'

export default function ContentImage({src, alt = '', width, height, style, blurDataURL = IMAGE_SHIMMER, placeholder = blurDataURL, ...props}) {
  const dimensions = typeof src === 'string' ? sizes[src.replace(/\/{2,}/g, '/')] : [src.width, src.height]
  const cssWidth = typeof width === 'string' && width.endsWith('%') ? width : undefined
  const cssHeight = typeof height === 'string' && height.endsWith('%') ? height : undefined
  let imageWidth = cssWidth ? undefined : width
  let imageHeight = cssHeight ? undefined : height
  if (dimensions) {
    imageWidth ??= imageHeight ? Math.round(Number(imageHeight) * dimensions[0] / dimensions[1]) : dimensions[0]
    imageHeight ??= Math.round(Number(imageWidth) * dimensions[1] / dimensions[0])
  }
  // Direct data placeholders keep SVG animation; Next's blur filter would blur it again.
  // A new source gets its own loading state, including gallery changes and retries.
  return <Image key={typeof src === 'string' ? src : src.src} {...props} src={src} alt={alt} unoptimized
    data-image-shimmer={placeholder === IMAGE_SHIMMER ? true : undefined}
    width={imageWidth} height={imageHeight} placeholder={placeholder} blurDataURL={blurDataURL}
    style={{aspectRatio: `${imageWidth} / ${imageHeight}`, ...(cssWidth && {width: cssWidth}), ...(cssHeight && {height: cssHeight}), ...style}} />
}
