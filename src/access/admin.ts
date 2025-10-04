import { Access } from 'payload'

export const admin: Access = ({ req: { user } }) => {
  if (user) {
    if (['admin', 'super-admin'].includes(user.role)) {
      return true
    }
  }
  return false
}

export const superAdmin: Access = ({ req: { user } }) => {
  if (user) {
    if (['super-admin'].includes(user.role)) {
      return true
    }
  }
  return false
}
