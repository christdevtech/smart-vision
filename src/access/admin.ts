import { Access } from 'payload'

export const admin: Access = ({ req: { user } }) => {
  if (user) {
    if (['admin', 'superadmin'].includes(user.role)) {
      return true
    }
  }
  return false
}
