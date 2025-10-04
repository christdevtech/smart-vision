'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react'

interface ThemeOption {
  value: string
  label: string
  icon: React.ReactNode
}

const themes: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    icon: <Sun className="w-4 h-4" />,
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: <Moon className="w-4 h-4" />,
  },
  {
    value: 'system',
    label: 'System',
    icon: <Monitor className="w-4 h-4" />,
  },
]

interface ThemeSwitcherProps {
  variant?: 'default' | 'compact' | 'icon-only'
  showLabel?: boolean
  className?: string
}

export function ThemeSwitcher({ 
  variant = 'default', 
  showLabel = true,
  className = '' 
}: ThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-lg bg-muted animate-pulse ${className}`} />
    )
  }

  const currentTheme = themes.find(t => t.value === theme) || themes[0]

  if (variant === 'icon-only') {
    return (
      <motion.button
        onClick={() => {
          const currentIndex = themes.findIndex(t => t.value === theme)
          const nextIndex = (currentIndex + 1) % themes.length
          setTheme(themes[nextIndex].value)
        }}
        className={`
          relative p-2 rounded-lg bg-background border border-border
          hover:bg-accent transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          ${className}
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-foreground"
          >
            {currentTheme.icon}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="
            flex items-center gap-2 px-3 py-2 rounded-lg
            bg-background border border-border
            hover:bg-accent transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
            text-sm font-medium text-foreground
          "
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {currentTheme.icon}
          {showLabel && <span>{currentTheme.label}</span>}
          <ChevronDown 
            className={`w-3 h-3 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="
                  absolute top-full mt-2 right-0 z-50
                  bg-popover border border-border rounded-lg shadow-lg
                  min-w-[140px] py-1
                "
              >
                {themes.map((themeOption) => (
                  <motion.button
                    key={themeOption.value}
                    onClick={() => {
                      setTheme(themeOption.value)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-sm
                      hover:bg-accent transition-colors duration-150
                      ${theme === themeOption.value 
                        ? 'bg-accent text-accent-foreground font-medium' 
                        : 'text-popover-foreground'
                      }
                    `}
                    whileHover={{ x: 4 }}
                  >
                    {themeOption.icon}
                    <span>{themeOption.label}</span>
                    {theme === themeOption.value && (
                      <motion.div
                        layoutId="activeTheme"
                        className="ml-auto w-2 h-2 rounded-full bg-primary"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Default variant - full dropdown
  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-3 px-4 py-3 rounded-lg
          bg-card border border-border
          hover:bg-accent transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          text-card-foreground min-w-[120px]
        "
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2 flex-1">
          {currentTheme.icon}
          {showLabel && <span className="font-medium">{currentTheme.label}</span>}
        </div>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="
                absolute top-full mt-2 left-0 right-0 z-50
                bg-popover border border-border rounded-lg shadow-lg
                py-2
              "
            >
              {themes.map((themeOption) => (
                <motion.button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-sm
                    hover:bg-accent transition-colors duration-150
                    ${theme === themeOption.value 
                      ? 'bg-accent text-accent-foreground font-medium' 
                      : 'text-popover-foreground'
                    }
                  `}
                  whileHover={{ x: 6 }}
                >
                  {themeOption.icon}
                  <span className="flex-1 text-left">{themeOption.label}</span>
                  {theme === themeOption.value && (
                    <motion.div
                      layoutId="activeThemeDefault"
                      className="w-2 h-2 rounded-full bg-primary"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}