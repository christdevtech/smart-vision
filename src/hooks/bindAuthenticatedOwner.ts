import { isAdminUser } from '@/access/ownerAccess'
import type { CollectionBeforeValidateHook } from 'payload'

export const bindAuthenticatedOwner = (ownerField: string): CollectionBeforeValidateHook => {
  return ({ data, operation, req }) => {
    if (!data || !req.user || isAdminUser(req.user)) return data

    const nextData = { ...data }

    if (operation === 'create') {
      nextData[ownerField] = req.user.id
    } else {
      delete nextData[ownerField]
    }

    return nextData
  }
}
