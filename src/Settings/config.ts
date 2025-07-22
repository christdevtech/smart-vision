import { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'siteName',
              type: 'text',
            },
            {
              name: 'siteDescription',
              type: 'text',
            },
            {
              name: 'siteLogo',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'siteFavicon',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              name: 'siteEmail',
              type: 'text',
            },
            {
              name: 'sitePhone',
              type: 'text',
            },
            {
              name: 'siteAddress',
              type: 'text',
            },
          ],
        },
        {
          label: 'Social',
          fields: [
            {
              name: 'siteSocial',
              type: 'array',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                },
                {
                  name: 'url',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            {
              name: 'siteCopyright',
              type: 'richText',
            },
          ],
        },
        {
          label: 'Subscriptions',
          fields: [
            {
              name: 'subscriptionCosts',
              type: 'group',
              fields: [
                {
                  name: 'monthly',
                  type: 'number',
                  label: 'Monthly Subscription Cost',
                  defaultValue: '3000',
                  required: true,
                },
                {
                  name: 'yearly',
                  type: 'number',
                  label: 'Yearly Subscription Cost',
                  defaultValue: '30000',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
