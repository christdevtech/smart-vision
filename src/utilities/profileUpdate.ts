import type { User } from '@/payload-types'

const allowedProfileFields = [
  'firstName',
  'lastName',
  'phoneNumber',
  'dateOfBirth',
  'academicLevel',
  'profilePic',
] as const

type AllowedProfileField = (typeof allowedProfileFields)[number]
export type ProfileUpdateData = Partial<Pick<User, AllowedProfileField>>

const allowedProfileFieldSet = new Set<string>(allowedProfileFields)
const phoneRegexE164 = /^\+?[1-9]\d{7,14}$/
const cameroonMobileRegex = /^6\d{8}$/

export class ProfileUpdateValidationError extends Error {}

const assertRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ProfileUpdateValidationError('Profile data must be an object')
  }

  return value as Record<string, unknown>
}

const readRequiredName = (value: unknown, label: string): string => {
  if (typeof value !== 'string') {
    throw new ProfileUpdateValidationError(`${label} must be a string`)
  }

  const normalized = value.trim()
  if (!normalized || normalized.length > 50) {
    throw new ProfileUpdateValidationError(`${label} must contain between 1 and 50 characters`)
  }

  return normalized
}

const readNullableRelationshipID = (value: unknown, label: string): string | null => {
  if (value === null || value === '') return null
  if (typeof value !== 'string' || !value.trim()) {
    throw new ProfileUpdateValidationError(`${label} must be a valid ID or null`)
  }

  return value.trim()
}

const readPhoneNumber = (value: unknown): string | null => {
  if (value === null || value === '') return null
  if (typeof value !== 'string') {
    throw new ProfileUpdateValidationError('Phone number must be a string or null')
  }

  const normalized = value.replace(/\s+/g, '')
  if (!phoneRegexE164.test(normalized) && !cameroonMobileRegex.test(normalized)) {
    throw new ProfileUpdateValidationError('Enter a valid phone number')
  }

  return normalized
}

const readDateOfBirth = (value: unknown): string | null => {
  if (value === null || value === '') return null
  if (typeof value !== 'string') {
    throw new ProfileUpdateValidationError('Date of birth must be a date string or null')
  }

  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) {
    throw new ProfileUpdateValidationError('Date of birth must be a valid date')
  }
  if (timestamp > Date.now()) {
    throw new ProfileUpdateValidationError('Date of birth cannot be in the future')
  }

  return value
}

export const parseProfileUpdate = (input: unknown): ProfileUpdateData => {
  const source = assertRecord(input)
  const keys = Object.keys(source)
  const unsupportedFields = keys.filter((key) => !allowedProfileFieldSet.has(key))

  if (unsupportedFields.length > 0) {
    throw new ProfileUpdateValidationError(
      `Unsupported profile fields: ${unsupportedFields.sort().join(', ')}`,
    )
  }
  if (keys.length === 0) {
    throw new ProfileUpdateValidationError('At least one profile field is required')
  }

  const output: ProfileUpdateData = {}

  if ('firstName' in source) output.firstName = readRequiredName(source.firstName, 'First name')
  if ('lastName' in source) output.lastName = readRequiredName(source.lastName, 'Last name')
  if ('phoneNumber' in source) output.phoneNumber = readPhoneNumber(source.phoneNumber)
  if ('dateOfBirth' in source) output.dateOfBirth = readDateOfBirth(source.dateOfBirth)
  if ('academicLevel' in source) {
    output.academicLevel = readNullableRelationshipID(source.academicLevel, 'Academic level')
  }
  if ('profilePic' in source) {
    output.profilePic = readNullableRelationshipID(source.profilePic, 'Profile picture')
  }

  return output
}
