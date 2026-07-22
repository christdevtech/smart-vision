export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 128

export const PASSWORD_POLICY_MESSAGE =
  'Use 10-128 characters with uppercase, lowercase, a number, and a special character.'

const COMMON_PASSWORDS = new Set([
  '1234567890',
  'password123',
  'qwerty12345',
  'smartvision',
  'smartvision1',
])

export function getPasswordPolicyError(password: unknown, email?: string): string | null {
  if (typeof password !== 'string') return PASSWORD_POLICY_MESSAGE
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return PASSWORD_POLICY_MESSAGE
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return PASSWORD_POLICY_MESSAGE
  }
  if (!/[^A-Za-z0-9]/.test(password)) return PASSWORD_POLICY_MESSAGE

  const normalized = password.toLowerCase()
  if (COMMON_PASSWORDS.has(normalized)) return 'Choose a password that is harder to guess.'

  const emailName = email?.trim().toLowerCase().split('@')[0]
  if (emailName && emailName.length >= 4 && normalized.includes(emailName)) {
    return 'Your password must not contain the email name used for this account.'
  }

  return null
}

export function isPasswordPolicySatisfied(password: unknown, email?: string): boolean {
  return getPasswordPolicyError(password, email) === null
}
