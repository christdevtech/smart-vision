import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/image', () => {
  const MockNextImage = ({
    alt = '',
    blurDataURL: _blurDataURL,
    fill: _fill,
    placeholder: _placeholder,
    priority: _priority,
    quality: _quality,
    sizes: _sizes,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & Record<string, unknown> & {
    fill?: boolean
    unoptimized?: boolean
  }) => <img alt={alt} {...props} />
  MockNextImage.displayName = 'MockNextImage'

  return { default: MockNextImage }
})

import { ImageMedia } from '@/components/Media/ImageMedia'

afterEach(cleanup)

describe('profile image fallback', () => {
  it('uses the supplied fallback when a media relationship is not populated', () => {
    render(<ImageMedia resource="media-id" fallback={<span>AS</span>} />)

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('AS')).toBeDefined()
  })

  it('replaces an R2 image with the fallback when the request fails', () => {
    render(
      <ImageMedia
        resource={
          {
            accessScope: 'owner',
            alt: 'Student profile',
            filename: 'missing-profile.png',
            height: 200,
            id: 'media-id',
            updatedAt: '2026-07-24T00:00:00.000Z',
            width: 200,
          } as any
        }
        fallback={<span>AS</span>}
      />,
    )

    fireEvent.error(screen.getByRole('img', { name: 'Student profile' }))
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('AS')).toBeDefined()
  })
})
