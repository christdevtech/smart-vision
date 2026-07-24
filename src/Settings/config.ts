import { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  admin: {
    group: 'Platform Settings',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user && ['admin', 'super-admin'].includes(user.role)),
  },
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
                  defaultValue: 500,
                  required: true,
                },
                {
                  name: 'yearly',
                  type: 'number',
                  label: 'Yearly Subscription Cost',
                  defaultValue: 3500,
                  required: true,
                },
              ],
            },
            {
              name: 'paymentAccounting',
              type: 'group',
              label: 'Payment and Referral Accounting',
              admin: {
                description:
                  'Percentages used to record provider fees, revenue, and referral rewards for future settled payments.',
              },
              fields: [
                {
                  name: 'providerFeePercentage',
                  type: 'number',
                  label: 'Fapshi Fee (%)',
                  defaultValue: 3,
                  min: 0,
                  max: 100,
                  required: true,
                  admin: {
                    description:
                      'Fallback fee used when Fapshi does not return an explicit revenue amount.',
                  },
                },
                {
                  name: 'referralProgramEnabled',
                  type: 'checkbox',
                  label: 'Enable Referral Rewards',
                  defaultValue: true,
                },
                {
                  name: 'referralRewardPercentage',
                  type: 'number',
                  label: 'Referral Reward (%)',
                  defaultValue: 30,
                  min: 0,
                  max: 100,
                  required: true,
                  admin: {
                    description:
                      'Percentage of the referred student’s gross settled subscription payment awarded to an eligible referrer.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
