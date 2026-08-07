import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/app/(onboarding)/onboarding/actions', () => ({
  submitOnboarding: vi.fn(),
}))

import OnboardingForm from '@/app/(onboarding)/onboarding/OnboardingForm'

describe('onboarding date picker', () => {
  it('allows the calendar to overflow the card while staying inside the viewport', () => {
    const { container } = render(
      <OnboardingForm
        academicLevels={[]}
        subjects={[]}
        user={{ id: 'user-1', firstName: 'Ada' } as any}
      />,
    )

    const card = container.firstElementChild
    expect(card?.classList.contains('overflow-visible')).toBe(true)
    expect(card?.classList.contains('overflow-hidden')).toBe(false)
    expect(card?.firstElementChild?.classList.contains('overflow-hidden')).toBe(true)

    const trigger = screen.getByRole('button', { name: /select date/i })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)

    const calendar = screen.getByRole('dialog', { name: 'Choose date' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(calendar.className).toContain('z-[100]')
    expect(calendar.className).toContain('max-w-[calc(100vw-2rem)]')
    expect(calendar.className).toContain('-translate-x-1/2')
  })
})
