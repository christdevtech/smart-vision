'use client'

import { animate, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const animatedElementSelector = [
  '.public-trust-row article',
  '.public-feature-card',
  '.public-content-card',
  '.public-process-grid article',
  '.public-price-card',
  '.public-contact-card',
  '.public-insight-card',
  '.public-editorial-photo',
].join(', ')

export function PublicMotionObserver() {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      return
    }

    const elements = Array.from(document.querySelectorAll<HTMLElement>(animatedElementSelector))
    const controls = new Map<HTMLElement, ReturnType<typeof animate>>()

    elements.forEach((element) => {
      element.style.opacity = '0'
      element.style.transform = 'translateY(16px) scale(0.99)'
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement
          controls.get(element)?.stop()

          if (entry.isIntersecting) {
            controls.set(
              element,
              animate(
                element,
                { opacity: 1, scale: 1, y: 0 },
                { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              ),
            )
          } else {
            controls.set(
              element,
              animate(
                element,
                { opacity: 0, scale: 0.99, y: 12 },
                { duration: 0.22, ease: 'easeOut' },
              ),
            )
          }
        })
      },
      {
        rootMargin: '0px 0px -7% 0px',
        threshold: 0.14,
      },
    )

    elements.forEach((element) => observer.observe(element))

    return () => {
      observer.disconnect()
      controls.forEach((control) => control.stop())
      elements.forEach((element) => {
        element.style.removeProperty('opacity')
        element.style.removeProperty('transform')
      })
    }
  }, [pathname, prefersReducedMotion])

  return null
}
