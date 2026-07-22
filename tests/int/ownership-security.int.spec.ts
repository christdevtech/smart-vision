import { ownerOrAdmin } from '@/access/ownerAccess'
import { updateUser } from '@/access/userAccess'
import { ContentAccess } from '@/collections/ContentAccess'
import { Notifications } from '@/collections/Notifications'
import { StudyPlans } from '@/collections/StudyPlans'
import { TestResults } from '@/collections/TestResults'
import { UserProgress } from '@/collections/UserProgress'
import { bindAuthenticatedOwner } from '@/hooks/bindAuthenticatedOwner'
import { describe, expect, it } from 'vitest'

const accessArgs = (user: Record<string, unknown> | null) => ({ req: { user } }) as any

const getField = (collection: { fields: any[] }, name: string): any => {
  const field = collection.fields.find((candidate) => candidate.name === name)
  if (!field) throw new Error(`Missing field: ${name}`)
  return field
}

describe('relationship-aware owner access', () => {
  it('returns a row-level owner constraint for ordinary users', async () => {
    const access = ownerOrAdmin('recipient')

    expect(await access(accessArgs({ id: 'user-1', role: 'user' }))).toEqual({
      recipient: { equals: 'user-1' },
    })
  })

  it('allows administrators and rejects anonymous callers', async () => {
    const access = ownerOrAdmin('user')

    expect(await access(accessArgs({ id: 'admin-1', role: 'admin' }))).toBe(true)
    expect(await access(accessArgs(null))).toBe(false)
  })

  it('uses document IDs for self-service user operations', async () => {
    expect(await updateUser(accessArgs({ id: 'user-1', role: 'user' }))).toEqual({
      id: { equals: 'user-1' },
    })
  })

  it('applies the correct ownership relationship to affected collections', async () => {
    const user = { id: 'user-1', role: 'user' }

    expect(await StudyPlans.access?.read?.(accessArgs(user))).toEqual({
      user: { equals: 'user-1' },
    })
    expect(await UserProgress.access?.update?.(accessArgs(user))).toEqual({
      user: { equals: 'user-1' },
    })
    expect(await TestResults.access?.read?.(accessArgs(user))).toEqual({
      user: { equals: 'user-1' },
    })
    expect(await Notifications.access?.update?.(accessArgs(user))).toEqual({
      recipient: { equals: 'user-1' },
    })
    expect(await ContentAccess.access?.read?.(accessArgs(user))).toEqual({
      user: { equals: 'user-1' },
    })
  })
})

describe('owner binding and sensitive fields', () => {
  const bindUser = bindAuthenticatedOwner('user')

  it('overrides a spoofed owner during authenticated creates', async () => {
    const result = await bindUser({
      data: { user: 'victim', contentId: 'video-1' },
      operation: 'create',
      req: { user: { id: 'attacker', role: 'user' } },
    } as any)

    expect(result).toEqual({ user: 'attacker', contentId: 'video-1' })
  })

  it('removes owner changes from ordinary user updates', async () => {
    const result = await bindUser({
      data: { user: 'victim', progressPercentage: 50 },
      operation: 'update',
      req: { user: { id: 'user-1', role: 'user' } },
    } as any)

    expect(result).toEqual({ progressPercentage: 50 })
  })

  it('preserves explicit owners for administrator operations', async () => {
    const result = await bindUser({
      data: { user: 'user-2' },
      operation: 'create',
      req: { user: { id: 'admin-1', role: 'admin' } },
    } as any)

    expect(result).toEqual({ user: 'user-2' })
  })

  it('makes owner fields immutable to ordinary users', async () => {
    const normalUser = accessArgs({ id: 'user-1', role: 'user' })
    const admin = accessArgs({ id: 'admin-1', role: 'admin' })

    for (const [collection, fieldName] of [
      [StudyPlans, 'user'],
      [UserProgress, 'user'],
      [TestResults, 'user'],
      [Notifications, 'recipient'],
    ] as const) {
      const field = getField(collection, fieldName)
      expect(await field.access.create(normalUser)).toBe(false)
      expect(await field.access.update(normalUser)).toBe(false)
      expect(await field.access.create(admin)).toBe(true)
    }
  })

  it('hides content access session metadata from ordinary users', async () => {
    const normalUser = accessArgs({ id: 'user-1', role: 'user' })
    const admin = accessArgs({ id: 'admin-1', role: 'admin' })

    for (const fieldName of ['deviceInfo', 'sessionToken']) {
      const field = getField(ContentAccess, fieldName)
      expect(await field.access.read(normalUser)).toBe(false)
      expect(await field.access.read(admin)).toBe(true)
    }
  })
})
