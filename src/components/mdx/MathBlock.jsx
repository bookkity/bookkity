import {useCallback} from 'react'

export default function MathBlock({children}) {
  const observeScroll = useCallback(block => {
    if (!block) return

    const viewport = block.firstElementChild
    const math = viewport.querySelector('.katex-display > .katex')
    const update = () => {
      const end = viewport.scrollWidth - viewport.clientWidth
      const overflowing = end > 1
      block.toggleAttribute('data-scroll-left', overflowing && viewport.scrollLeft > 1)
      block.toggleAttribute('data-scroll-right', overflowing && viewport.scrollLeft < end - 1)
      if (overflowing) {
        viewport.tabIndex = 0
        viewport.setAttribute('role', 'region')
        viewport.setAttribute('aria-label', 'Scrollable equation')
      } else {
        viewport.removeAttribute('tabindex')
        viewport.removeAttribute('role')
        viewport.removeAttribute('aria-label')
      }
    }

    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    if (math) observer.observe(math)
    viewport.addEventListener('scroll', update, {passive: true})
    update()

    return () => {
      observer.disconnect()
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <span className="math-block" ref={observeScroll}>
      <span className="math-scroll">{children}</span>
    </span>
  )
}
