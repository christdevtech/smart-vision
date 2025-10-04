'use client'

import { motion, AnimatePresence, Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
  transition?: 'slide' | 'fade' | 'scale'
  direction?: 'left' | 'right' | 'up' | 'down'
}

const transitionVariants: Record<string, Variants> = {
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  slideLeft: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 }
  },
  slideRight: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 }
  },
  slideUp: {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -100 }
  },
  slideDown: {
    initial: { opacity: 0, y: -100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 100 }
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 }
  }
}

export default function PageTransition({
  children,
  className = '',
  transition = 'slide',
  direction = 'right'
}: PageTransitionProps) {
  const getVariants = () => {
    if (transition === 'slide') {
      switch (direction) {
        case 'left':
          return transitionVariants.slideLeft
        case 'right':
          return transitionVariants.slideRight
        case 'up':
          return transitionVariants.slideUp
        case 'down':
          return transitionVariants.slideDown
        default:
          return transitionVariants.slide
      }
    }
    return transitionVariants[transition]
  }

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={getVariants()}
      transition={{
        duration: 0.3,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  )
}

// Wrapper component for page-level transitions
export function PageTransitionWrapper({ 
  children, 
  ...props 
}: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <PageTransition {...props}>
        {children}
      </PageTransition>
    </AnimatePresence>
  )
}