import { userCreate } from '@/access/userAccess'
import { Users } from '@/collections/Users'
import { beforeChangeUser } from '@/collections/Users/hooks/beforeCreateUser'
import { enforcePublicUserDefaults } from '@/collections/Users/hooks/enforcePublicUserDefaults'
import { parseProfileUpdate, ProfileUpdateValidationError } from '@/utilities/profileUpdate'
import { describe, expect, it } from 'vitest'

const accessArgs = (user: Record<string, unknown> | null) => ({ req: { user } }) as any

const getUserField = (name: string): any => {
  const field = Users.fields.find((candidate) => 'name' in candidate && candidate.name === name)
  if (!field) throw new Error(`Missing Users field: ${name}`)
  return field
}

describe('public user creation security', () => {
  it('allows anonymous registration but blocks account creation by ordinary authenticated users', async () => {
    expect(await userCreate(accessArgs(null))).toBe(true)
    expect(await userCreate(accessArgs({ id: 'user-1', role: 'user' }))).toBe(false)
    expect(await userCreate(accessArgs({ id: 'admin-1', role: 'admin' }))).toBe(true)
  })

  it('forces server-owned defaults and removes protected public registration fields', async () => {
    const result = await enforcePublicUserDefaults({
      data: {
        firstName: 'Student',
        isActive: false,
        lastActiveAt: '2026-01-01',
        onboarded: true,
        referredBy: 'attacker-selected-user',
        referralCode: 'chosen-code',
        role: 'super-admin',
        totalReferrals: 999,
      },
      operation: 'create',
      req: { user: null },
    } as any)

    expect(result).toEqual({
      firstName: 'Student',
      isActive: true,
      onboarded: false,
      role: 'user',
    })
  })

  it('does not overwrite values supplied by an authenticated administrator', async () => {
    const result = await enforcePublicUserDefaults({
      data: { role: 'content-manager' },
      operation: 'create',
      req: { user: { id: 'admin-1', role: 'admin' } },
    } as any)

    expect(result).toEqual({ role: 'content-manager' })
  })

  it('denies public creation of privileged and server-managed fields', async () => {
    for (const fieldName of [
      'isActive',
      'lastActiveAt',
      'onboarded',
      'referredBy',
      'referralCode',
      'role',
      'totalReferrals',
    ]) {
      const field = getUserField(fieldName)
      expect(await field.access.create(accessArgs(null))).toBe(false)
      expect(await field.access.update(accessArgs({ id: 'user-1', role: 'user' }))).toBe(false)
    }
  })

  it('preserves an existing referral code on partial profile updates', async () => {
    const result = await beforeChangeUser({
      data: { firstName: 'Updated' },
      operation: 'update',
      originalDoc: { referralCode: '1234567' },
      req: { payload: {} },
    } as any)

    expect(result).toEqual({ firstName: 'Updated' })
  })
})

describe('profile update input', () => {
  it('rejects privilege escalation and other mass-assignment fields', () => {
    for (const field of ['role', 'isActive', 'onboarded', 'totalReferrals']) {
      expect(() => parseProfileUpdate({ [field]: true })).toThrow(ProfileUpdateValidationError)
    }
  })

  it('accepts and normalizes the supported profile fields', () => {
    expect(
      parseProfileUpdate({
        academicLevel: ' level-1 ',
        dateOfBirth: '2008-06-15',
        firstName: '  Ada ',
        lastName: ' Student  ',
        phoneNumber: '+237 699 999 999',
        profilePic: null,
      }),
    ).toEqual({
      academicLevel: 'level-1',
      dateOfBirth: '2008-06-15',
      firstName: 'Ada',
      lastName: 'Student',
      phoneNumber: '+237699999999',
      profilePic: null,
    })
  })

  it('rejects malformed profile values', () => {
    expect(() => parseProfileUpdate({ firstName: '' })).toThrow('First name must contain')
    expect(() => parseProfileUpdate({ phoneNumber: '123' })).toThrow('Enter a valid phone number')
    expect(() => parseProfileUpdate({ dateOfBirth: 'not-a-date' })).toThrow(
      'Date of birth must be a valid date',
    )
  })
})
