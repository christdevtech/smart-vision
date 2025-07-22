import { Access } from 'payload'

export const readTransactions: Access = ({ req: { user }, data }) => {
  if (user && ['admin', 'superadmin'].includes(user.role)) {
    return true
  }
  if (user && data.user.id === user.id) {
    return true
  }
  return false
}
