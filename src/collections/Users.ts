import type { CollectionConfig } from 'payload'

// Function to generate a unique 6-digit code
const generateUniqueCode = async (payload: any): Promise<string> => {
  let code: string
  let isUnique = false

  while (!isUnique) {
    // Generate a random 7-digit number
    code = Math.floor(1000000 + Math.random() * 9000000).toString()

    // Check if this code already exists
    const existing = await payload.find({
      collection: 'users',
      where: {
        referralCode: {
          equals: code,
        },
      },
    })

    if (existing.docs.length === 0) {
      isUnique = true
    }
  }

  return code!
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
      maxLength: 50,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      maxLength: 50,
    },
    {
      name: 'phoneNumber',
      type: 'text',
    },
    {
      name: 'dateOfBirth',
      type: 'date',
    },
    {
      name: 'educationLevel',
      type: 'select',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'High School', value: 'highschool' },
        { label: 'University', value: 'university' },
      ],
    },
    // {
    //   name: 'preferredSubjects',
    //   type: 'relationship',
    //   relationTo: 'subjects',
    //   hasMany: true,
    // },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'referralCode',
      type: 'text',
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'referredBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'totalReferrals',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'lastActiveAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-generate referralCode for new users
        if (operation === 'create' || !data.referralCode) {
          data.referralCode = await generateUniqueCode(req.payload)
        }
        return data
      },
    ],
  },
}
