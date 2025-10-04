import { Access } from 'payload'

export const userCreate: Access = () => {
  return true
}

export const readUser: Access = ({ req: { user }, data }) => {
  if (user && data && data.id === user.id) {
    return true
  }
  if (user && ['admin', 'super-admin'].includes(user.role)) {
    return true
  }
  return false
}

export const updateUser: Access = ({ req: { user }, data }) => {
  if (user && data && data.id === user.id) {
    return true
  }
  if (user && ['admin', 'super-admin'].includes(user.role)) {
    return true
  }
  return false
}

export const deleteUser: Access = ({ req: { user }, data }) => {
  if (user && data && data.id === user.id) {
    return true
  }
  if (user && ['admin', 'super-admin'].includes(user.role)) {
    return true
  }
  return false
}
