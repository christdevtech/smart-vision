import { Access } from 'payload'
import { isAdminUser, ownerOrAdmin } from './ownerAccess'

export const userCreate: Access = ({ req: { user } }) => {
  if (!user) return true

  return isAdminUser(user)
}

export const readUser = ownerOrAdmin('id')
export const updateUser = ownerOrAdmin('id')
export const deleteUser = ownerOrAdmin('id')
