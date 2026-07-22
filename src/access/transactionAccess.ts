import { ownerOrAdmin } from './ownerAccess'

export const readTransactions = ownerOrAdmin('user')
