import { fireEvent, render, screen } from '@testing-library/react'
import React, { forwardRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('framer-motion', () => {
  const motionComponent = (tag: 'article' | 'div') => {
    const Component = forwardRef<
      HTMLElement,
      React.HTMLAttributes<HTMLElement> & {
        animate?: unknown
        exit?: unknown
        initial?: unknown
        transition?: unknown
        viewport?: unknown
        whileInView?: unknown
      }
    >(
      (
        {
          animate: _animate,
          exit: _exit,
          initial: _initial,
          transition: _transition,
          viewport: _viewport,
          whileInView: _whileInView,
          ...props
        },
        ref,
      ) => React.createElement(tag, { ...props, ref }),
    )
    Component.displayName = `MockMotion${tag[0].toUpperCase()}${tag.slice(1)}`
    return Component
  }

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: {
      article: motionComponent('article'),
      div: motionComponent('div'),
    },
    useReducedMotion: () => true,
  }
})

import { FAQAccordion, FAQAccordionProvider } from '@/components/PublicSite/FAQAccordion'

describe('public FAQ accordion', () => {
  it('keeps only one answer open across FAQ groups', () => {
    render(
      <FAQAccordionProvider>
        <FAQAccordion
          groupId="accounts"
          items={[{ answer: 'Create an account securely.', question: 'How do I register?' }]}
        />
        <FAQAccordion
          groupId="payments"
          items={[{ answer: 'Use mobile money.', question: 'How do I pay?' }]}
        />
      </FAQAccordionProvider>,
    )

    const registrationButton = screen.getByRole('button', { name: 'How do I register?' })
    const paymentButton = screen.getByRole('button', { name: 'How do I pay?' })

    fireEvent.click(registrationButton)
    expect(registrationButton.getAttribute('aria-expanded')).toBe('true')
    expect(screen.queryByText('Create an account securely.')).not.toBeNull()

    fireEvent.click(paymentButton)
    expect(registrationButton.getAttribute('aria-expanded')).toBe('false')
    expect(paymentButton.getAttribute('aria-expanded')).toBe('true')
    expect(screen.queryByText('Create an account securely.')).toBeNull()
    expect(screen.queryByText('Use mobile money.')).not.toBeNull()
  })
})
