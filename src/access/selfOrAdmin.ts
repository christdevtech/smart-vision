import { ownerOrAdmin } from './ownerAccess'

export const selfOrAdmin = ownerOrAdmin('user')
