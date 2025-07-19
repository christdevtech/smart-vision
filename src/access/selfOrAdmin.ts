import { Access, Where } from 'payload'

// @ts-ignore - Payload CMS role field compatibility
export const selfOrAdmin: Access = ({ req: { user } }) => {
  if (user) {
    return {
      or: [
        {
          id: {
            equals: user.id,
          },
        },
        {
          role: {
            in: ['user', 'admin'],
          },
        },
      ],
    }
  }

  return false
}
