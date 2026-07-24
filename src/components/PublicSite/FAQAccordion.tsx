'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'

type FAQItem = {
  answer: string
  question: string
}

type AccordionContextValue = {
  openKey: string | null
  setOpenKey: (key: string | null) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

export function FAQAccordionProvider({ children }: { children: ReactNode }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const value = useMemo(() => ({ openKey, setOpenKey }), [openKey])

  return <AccordionContext.Provider value={value}>{children}</AccordionContext.Provider>
}

export function FAQAccordion({ groupId = 'faq', items }: { groupId?: string; items: FAQItem[] }) {
  const sharedState = useContext(AccordionContext)
  const [localOpenKey, setLocalOpenKey] = useState<string | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const openKey = sharedState?.openKey ?? localOpenKey
  const setOpenKey = sharedState?.setOpenKey ?? setLocalOpenKey

  return (
    <div className="public-faq-list">
      {items.map((item, index) => {
        const itemKey = `${groupId}-${index}`
        const panelId = `${itemKey}-panel`
        const triggerId = `${itemKey}-trigger`
        const isOpen = openKey === itemKey

        return (
          <motion.article
            className={`public-faq-item ${isOpen ? 'public-faq-item--open' : ''}`}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            key={itemKey}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ amount: 0.25, once: false }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          >
            <h3>
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                id={triggerId}
                onClick={() => setOpenKey(isOpen ? null : itemKey)}
                type="button"
              >
                <span>{item.question}</span>
                <ChevronDown aria-hidden="true" size={20} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  animate={{ height: 'auto', opacity: 1 }}
                  aria-labelledby={triggerId}
                  exit={{ height: 0, opacity: 0 }}
                  id={panelId}
                  initial={{ height: 0, opacity: 0 }}
                  role="region"
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <p>{item.answer}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.article>
        )
      })}
    </div>
  )
}
