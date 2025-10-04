import { Variants } from 'framer-motion'

// Scroll-triggered animations
export const scrollAnimations: Record<string, Variants> = {
  fadeInUp: {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  },
  slideInLeft: {
    hidden: { opacity: 0, x: -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  },
  slideInRight: {
    hidden: { opacity: 0, x: 60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  },
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },
  staggerItem: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  },
}

// Interactive animations
export const interactiveAnimations: Record<string, Variants> = {
  cardHover: {
    rest: { scale: 1, y: 0 },
    hover: {
      scale: 1.02,
      y: -4,
      transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    tap: { scale: 0.98 },
  },
  buttonPress: {
    rest: { scale: 1 },
    tap: { scale: 0.95 },
    hover: { scale: 1.05 },
  },
  iconBounce: {
    rest: { scale: 1 },
    hover: {
      scale: 1.1,
      transition: { type: 'spring', stiffness: 400, damping: 10 },
    },
  },
}

// Notification animations
export const notificationAnimations: Record<string, Variants> = {
  slideInFromTop: {
    initial: { y: -100, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      y: -100,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  },
  notificationCenter: {
    initial: { y: -20, opacity: 0, scale: 0.95 },
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
    exit: {
      y: -20,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.15 },
    },
  },
  badgePulse: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatDelay: 2,
      },
    },
  },
  toast: {
    initial: { x: 300, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
      x: 300,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  },
}

// Navigation animations
export const navigationAnimations: Record<string, Variants> = {
  bottomNavSlide: {
    hidden: { y: 100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: 0.2,
      },
    },
  },
  navItemActive: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.1, 1],
      transition: { duration: 0.3 },
    },
  },
  menuExpand: {
    initial: { width: 0, opacity: 0 },
    animate: {
      width: 'auto',
      opacity: 1,
      transition: {
        width: { type: 'spring', stiffness: 300 },
        opacity: { delay: 0.1 },
      },
    },
    exit: {
      width: 0,
      opacity: 0,
      transition: {
        opacity: { duration: 0.1 },
        width: { delay: 0.1, type: 'spring', stiffness: 300 },
      },
    },
  },
  sidebarSlide: {
    initial: { x: -300, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
      x: -300,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  },
}

// Loading animations
export const loadingAnimations: Record<string, Variants> = {
  spinner: {
    initial: { rotate: 0 },
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },
  pulse: {
    initial: { scale: 1, opacity: 0.7 },
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: [0.42, 0, 0.58, 1],
      },
    },
  },
  skeleton: {
    initial: { opacity: 0.4 },
    animate: {
      opacity: [0.4, 0.8, 0.4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: [0.42, 0, 0.58, 1],
      },
    },
  },
}

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

// Utility function to create stagger animations
export const createStaggerVariants = (
  staggerDelay = 0.1,
  childDelay = 0,
): { container: Variants; item: Variants } => ({
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: childDelay,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  },
})