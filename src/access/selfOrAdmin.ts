import { Access, Where } from 'payload'

export const selfOrAdmin: Access = ({ req: { user }, data }) => {
  if (user && data && data.id === user.id) {
    return true
  }
  if (user && ['admin', 'superadmin'].includes(user.role)) {
    return true
  }
  return false
}
