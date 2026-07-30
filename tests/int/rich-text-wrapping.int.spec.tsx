import { render } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import RichText from '@/components/RichText'

const longQuestion = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'ThisIsAnExceptionallyLongQuestionTokenThatMustNotEscapeTheStudentViewport',
            type: 'text',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
} as any

describe('rich text wrapping', () => {
  it('allows long question content to shrink and wrap inside its container', () => {
    const { container } = render(
      <RichText data={longQuestion} enableGutter={false} enableProse={false} />,
    )
    const richText = container.firstElementChild

    expect(richText?.classList.contains('min-w-0')).toBe(true)
    expect(richText?.classList.contains('max-w-full')).toBe(true)
    expect(richText?.classList.contains('max-w-none')).toBe(false)
    expect(richText?.classList.contains('whitespace-normal')).toBe(true)
    expect(richText?.className).toContain('[overflow-wrap:anywhere]')
    expect(richText?.className).toContain('[&_table]:overflow-x-auto')
  })
})
