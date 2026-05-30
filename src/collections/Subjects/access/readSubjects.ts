import type { Access } from 'payload'

export const readSubjects: Access = ({ req: { user } }) => {
  // If no user is logged in, they cannot see any subjects
  // since there is no public browsing.
  if (!user) {
    return false
  }

  // Admins and Super Admins can see all subjects
  if (user.role === 'admin' || user.role === 'super-admin') {
    return true
  }

  // If the user is a standard user, filter by their academicLevel
  if (user.academicLevel) {
    const levelId = typeof user.academicLevel === 'object' ? user.academicLevel.id : user.academicLevel
    
    return {
      academicLevels: {
        in: [levelId],
      },
    }
  }

  // If a user has no academic level assigned, they see no subjects
  return false
}
