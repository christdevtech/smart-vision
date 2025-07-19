import { Access } from 'payload'

export const authenticated: Access = ({ req: { user }, data }) => {
  return Boolean(user)
}
