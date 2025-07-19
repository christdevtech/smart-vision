import type { ArrayField, Field } from 'payload'

import type { LinkAppearances } from './link'

import deepMerge from '@/utilities/deepMerge'
import { link } from './link'
import { buttonClasses } from './buttonClasses'

type LinkGroupType = (options?: {
  appearances?: LinkAppearances[] | false
  overrides?: Partial<ArrayField>
  buttonClass?: string[]
}) => Field

export const linkGroup: LinkGroupType = ({ appearances, overrides = {}, buttonClass } = {}) => {
  const generatedLinkGroup: Field = {
    name: 'links',
    type: 'array',
    fields: [
      link({
        appearances,
      }),
      buttonClasses({
        overrides: {
          defaultValue: buttonClass,
        },
      }),
      {
        name: 'size',
        type: 'select',
        defaultValue: 'default',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Small', value: 'sm' },
          { label: 'Large', value: 'lg' },
        ],
      },
    ],
  }

  return deepMerge(generatedLinkGroup, overrides)
}
