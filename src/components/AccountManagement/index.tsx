'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AcademicLevel, User } from '@/payload-types'
import { toast } from 'sonner'
import { Camera, CheckCircle, Shield, Trash2, X, Edit, Laptop, Download } from 'lucide-react'
import { DatePicker } from '@/components/DatePicker'
import { Media } from '@/components/Media'
import { AccountSessionsPanel } from './AccountSessionsPanel'
import { getPasswordPolicyError, PASSWORD_POLICY_MESSAGE } from '@/utilities/passwordPolicy'

type Props = {
  user: User
  academicLevels: AcademicLevel[]
  profileMedia?: User['profilePic']
}

const phoneRegexE164 = /^\+?[1-9]\d{7,14}$/

function genToken() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function AccountManagement({ user, academicLevels, profileMedia }: Props) {
  const [csrfToken, setCsrfToken] = useState('')
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null)
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null)
  const [currentProfileMedia, setCurrentProfileMedia] = useState<User['profilePic']>(
    profileMedia || null,
  )
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [firstName, setFirstName] = useState(user.firstName || '')
  const [lastName, setLastName] = useState(user.lastName || '')
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '')
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '')
  const [academicLevelId, setAcademicLevelId] = useState<string | undefined>(
    typeof user.academicLevel === 'string' ? user.academicLevel : (user.academicLevel as any)?.id,
  )
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [deleteConfirmOne, setDeleteConfirmOne] = useState(false)
  const [deleteConfirmTwo, setDeleteConfirmTwo] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [exportPassword, setExportPassword] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [securityTab, setSecurityTab] = useState<'password' | 'sessions' | 'privacy' | 'delete'>(
    'password',
  )
  const [changeFlow, setChangeFlow] = useState(false)

  useEffect(() => {
    const existing = document.cookie.match(/(?:^|; )csrfToken=([^;]+)/)
    const token = existing ? existing[1] : genToken()
    if (!existing) {
      document.cookie = `csrfToken=${token}; Path=/; SameSite=Lax`
    }
    setCsrfToken(token)
  }, [])

  useEffect(() => {
    if (profilePicFile) {
      const url = URL.createObjectURL(profilePicFile)
      setProfilePicPreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [profilePicFile])

  const accountCompletion = useMemo(() => {
    const fields = [
      Boolean(phoneNumber),
      Boolean(dateOfBirth),
      Boolean(academicLevelId),
      Boolean(user.profilePic),
    ]
    return Math.round((fields.filter(Boolean).length / 4) * 100)
  }, [phoneNumber, dateOfBirth, academicLevelId, user.profilePic])

  const validDOB = useMemo(() => {
    if (!dateOfBirth) return true
    const dob = new Date(dateOfBirth)
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    return age >= 13
  }, [dateOfBirth])

  const validPhone = useMemo(() => {
    if (!phoneNumber) return true
    const stripped = phoneNumber.replace(/\s+/g, '')
    return phoneRegexE164.test(stripped) || /^6\d{8}$/.test(stripped)
  }, [phoneNumber])

  const passwordError = useMemo(
    () => (newPassword ? getPasswordPolicyError(newPassword, user.email) : null),
    [newPassword, user.email],
  )

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isValidType = ['image/jpeg', 'image/png'].includes(file.type)
    const isValidSize = file.size <= 3 * 1024 * 1024
    if (!isValidType) {
      toast.error('Only JPG and PNG images are allowed')
      return
    }
    if (!isValidSize) {
      toast.error('Image size must be 3MB or less')
      return
    }
    setProfilePicFile(file)

    if (changeFlow) {
      try {
        const newMediaId = await uploadProfilePic()
        if (!newMediaId) return
        const res = await fetch('/api/custom/account/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
          body: JSON.stringify({ data: { profilePic: newMediaId } }),
          credentials: 'include',
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to set new profile image')
          return
        }

        toast.success('Profile picture updated')
        setProfileMenuOpen(false)
      } finally {
        setChangeFlow(false)
      }
    }
  }

  const uploadProfilePic = async (): Promise<string | null> => {
    if (!profilePicFile) return null
    const fd = new FormData()
    fd.append('file', profilePicFile)
    const res = await fetch('/api/media', { method: 'POST', body: fd, credentials: 'include' })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.message || 'Failed to upload image')
      return null
    }
    return data?.doc?.id || data?.id || null
  }

  const saveProfile = async () => {
    if (!validDOB) {
      toast.error('You must be at least 13 years old')
      return
    }
    if (!validPhone) {
      toast.error('Enter a valid phone number')
      return
    }
    setIsSavingProfile(true)
    try {
      const mediaId = await uploadProfilePic()
      const payload: Record<string, any> = {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || null,
        phoneNumber: phoneNumber || null,
        academicLevel: academicLevelId || null,
      }
      if (mediaId) payload.profilePic = mediaId
      const res = await fetch('/api/custom/account/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ data: payload }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to update profile')
      } else {
        toast.success('Profile updated')
        setProfileMenuOpen(false)
      }
    } catch (e) {
      toast.error('An error occurred while saving profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const triggerChangeProfilePic = () => {
    fileInputRef.current?.click()
  }

  const beginChangeImage = async () => {
    try {
      const mediaId =
        currentProfileMedia && typeof currentProfileMedia === 'object'
          ? currentProfileMedia.id
          : currentProfileMedia ||
            (typeof user.profilePic === 'string' ? (user.profilePic as string) : null)
      if (mediaId) {
        const res = await fetch('/api/custom/account/remove-profile-pic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
          body: JSON.stringify({ mediaId }),
          credentials: 'include',
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to remove previous image')
          return
        }
        setCurrentProfileMedia(null)
        setProfilePicPreview(null)
        setProfilePicFile(null)
      }
      setChangeFlow(true)
      triggerChangeProfilePic()
    } catch {
      toast.error('Error preparing to change image')
    }
  }

  const removeProfilePic = async () => {
    try {
      const mediaId =
        currentProfileMedia && typeof currentProfileMedia === 'object'
          ? currentProfileMedia.id
          : currentProfileMedia ||
            (typeof user.profilePic === 'string' ? (user.profilePic as string) : null)
      const res = await fetch('/api/custom/account/remove-profile-pic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ mediaId }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to remove profile picture')
      } else {
        toast.success('Profile picture removed')
        setCurrentProfileMedia(null)
        setProfilePicFile(null)
        setProfilePicPreview(null)
        setProfileMenuOpen(false)
      }
    } catch {
      toast.error('An error occurred while removing profile picture')
    }
  }

  const changePassword = async () => {
    if (!currentPassword) {
      toast.error('Enter current password')
      return
    }
    if (passwordError) {
      toast.error(passwordError)
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setIsChangingPassword(true)
    try {
      const res = await fetch('/api/custom/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to change password')
      } else {
        toast.success('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      toast.error('An error occurred while changing password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const deleteAccount = async () => {
    if (!deleteConfirmOne || !deleteConfirmTwo) {
      toast.error('Please confirm deletion steps')
      return
    }
    if (!deletePassword) {
      toast.error('Enter your password to confirm')
      return
    }
    setIsDeleting(true)
    try {
      const res = await fetch('/api/custom/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ password: deletePassword }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to schedule account deletion')
      } else {
        toast.success('Account deletion scheduled. Contact support within 30 days to restore it.')
        window.location.href = '/'
      }
    } catch {
      toast.error('An error occurred while scheduling account deletion')
    } finally {
      setIsDeleting(false)
    }
  }

  const exportAccountData = async () => {
    if (!exportPassword) {
      toast.error('Enter your password to create the export')
      return
    }

    setIsExporting(true)
    try {
      const res = await fetch('/api/custom/account/data-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ password: exportPassword }),
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to create data export')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const disposition = res.headers.get('content-disposition') || ''
      const filename =
        disposition.match(/filename="([^"]+)"/)?.[1] || 'smartvision-personal-data.json'
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setExportPassword('')
      toast.success('Your personal data export is ready')
    } catch {
      toast.error('An error occurred while creating the export')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl border bg-card border-border/50">
        <div className="flex gap-3 items-center mb-4">
          <Camera className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Profile Management</h2>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <div
                className="overflow-hidden relative w-48 h-48 rounded-full cursor-pointer group bg-border"
                aria-label="Profile Picture"
                onClick={() => setProfileMenuOpen((v) => !v)}
              >
                {profilePicPreview ? (
                  <img
                    src={profilePicPreview}
                    alt="Profile preview"
                    className="object-cover w-full h-full"
                  />
                ) : currentProfileMedia ? (
                  <Media fill resource={currentProfileMedia as any} imgClassName="object-cover" />
                ) : (
                  <div className="flex justify-center items-center w-full h-full text-muted-foreground">
                    PN
                  </div>
                )}
                <div className="flex absolute inset-0 justify-center items-center opacity-100 transition-opacity bg-black/30 md:opacity-0 md:group-hover:opacity-100">
                  <Edit className="w-6 h-6 text-white" />
                </div>
              </div>
              {profileMenuOpen && (
                <div className="absolute top-full left-1/2 z-10 mt-2 w-48 rounded-lg border shadow-md -translate-x-1/2 bg-popover border-border">
                  <button
                    className="px-3 py-2 w-full text-left hover:bg-accent"
                    onClick={beginChangeImage}
                  >
                    Change image
                  </button>
                  <button
                    className="px-3 py-2 w-full text-left hover:bg-accent text-destructive"
                    onClick={removeProfilePic}
                  >
                    Remove image
                  </button>
                  <button
                    className="px-3 py-2 w-full text-left hover:bg-accent"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <span className="inline-flex gap-2 items-center">
                      <X className="w-4 h-4" /> Close
                    </span>
                  </button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleProfilePicChange}
              className="hidden"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm text-muted-foreground">First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-muted-foreground">Last Name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm text-muted-foreground">Academic Level</label>
              <select
                value={academicLevelId || ''}
                onChange={(e) => setAcademicLevelId(e.target.value || undefined)}
                className="px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select level</option>
                {academicLevels.map((level) => (
                  <option key={level.id} value={level.id as string}>
                    {(level as any).name || level.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm text-muted-foreground">Date of Birth</label>
              <DatePicker
                value={dateOfBirth || ''}
                onChange={(v) => setDateOfBirth(v)}
                disabled={{ after: new Date() }}
                captionLayout="dropdown"
                fromYear={1950}
                toYear={new Date().getFullYear()}
              />
              {!validDOB && (
                <p className="mt-2 text-xs text-destructive">You must be at least 13 years old</p>
              )}
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm text-muted-foreground">Phone Number</label>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +2376XXXXXXXX"
              className="px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {!validPhone && (
              <p className="mt-2 text-xs text-destructive">Enter a valid phone number</p>
            )}
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Account completion: {accountCompletion}%</span>
            </div>
            <button
              onClick={saveProfile}
              disabled={isSavingProfile}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            >
              {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border bg-card border-border/50">
        <div className="flex gap-3 items-center mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
        </div>
        <div
          role="tablist"
          aria-label="Security options"
          className="grid overflow-hidden w-full max-w-2xl grid-cols-2 rounded-xl border border-border bg-card sm:grid-cols-4"
        >
          <button
            role="tab"
            aria-selected={securityTab === 'sessions'}
            className={`flex-1 px-4 py-2 text-sm flex items-center justify-center gap-2 transition-all border-l border-border ${securityTab === 'sessions' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'}`}
            onClick={() => setSecurityTab('sessions')}
          >
            <Laptop className="w-4 h-4" />
            <span>Sessions</span>
          </button>
          <button
            role="tab"
            aria-selected={securityTab === 'password'}
            className={`flex-1 px-4 py-2 text-sm flex items-center justify-center gap-2 transition-all ${securityTab === 'password' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'}`}
            onClick={() => setSecurityTab('password')}
          >
            <Shield className="w-4 h-4" />
            <span>Password</span>
          </button>
          <button
            role="tab"
            aria-selected={securityTab === 'privacy'}
            className={`flex-1 px-4 py-2 text-sm flex items-center justify-center gap-2 transition-all border-l border-border ${securityTab === 'privacy' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'}`}
            onClick={() => setSecurityTab('privacy')}
          >
            <Download className="w-4 h-4" />
            <span>Privacy</span>
          </button>
          <button
            role="tab"
            aria-selected={securityTab === 'delete'}
            className={`flex-1 px-4 py-2 text-sm flex items-center justify-center gap-2 transition-all border-l border-border ${securityTab === 'delete' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'}`}
            onClick={() => setSecurityTab('delete')}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>

        <div className="mt-3 rounded-xl border bg-card border-border">
          {securityTab === 'password' ? (
            <div className="p-4">
              <div className="flex gap-2 items-center mb-3">
                <Shield className="w-4 h-4 text-primary" />
                <p className="font-medium text-foreground">Change Password</p>
              </div>
              <div className="space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {newPassword && (
                  <p className={`text-xs ${passwordError ? 'text-destructive' : 'text-success'}`}>
                    {passwordError || 'Password meets the security requirements.'}
                  </p>
                )}
                {!newPassword && (
                  <p className="text-xs text-muted-foreground">{PASSWORD_POLICY_MESSAGE}</p>
                )}
                <button
                  onClick={changePassword}
                  disabled={isChangingPassword}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          ) : securityTab === 'sessions' ? (
            <AccountSessionsPanel csrfToken={csrfToken} />
          ) : securityTab === 'privacy' ? (
            <div className="p-4">
              <div className="flex gap-2 items-center mb-3">
                <Download className="w-4 h-4 text-primary" />
                <p className="font-medium text-foreground">Download your personal data</p>
              </div>
              <div className="max-w-xl space-y-3">
                <p className="text-sm text-muted-foreground">
                  Create a JSON file containing your account, learning activity, subscriptions,
                  payments, notifications, and referral records. Passwords, active session tokens,
                  and protected content keys are never included.
                </p>
                <input
                  type="password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  placeholder="Enter password to confirm"
                  autoComplete="current-password"
                  className="px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={exportAccountData}
                  disabled={isExporting}
                  className="flex gap-2 items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Preparing export...' : 'Download my data'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex gap-2 items-center mb-3">
                <Trash2 className="w-4 h-4 text-destructive" />
                <p className="font-medium text-foreground">Schedule account deletion</p>
              </div>
              <div className="max-w-xl space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your account will be deactivated immediately and anonymized after 30 days.
                  Learning activity and profile data will then be removed. Financial, referral,
                  security, and audit records are retained in anonymized form where required for
                  reconciliation and platform integrity. Contact support before the scheduled date
                  if you need to restore the account.
                </p>
                <label className="flex gap-2 items-center text-sm">
                  <input
                    type="checkbox"
                    checked={deleteConfirmOne}
                    onChange={(e) => setDeleteConfirmOne(e.target.checked)}
                  />{' '}
                  I understand I will be signed out and unable to use the account.
                </label>
                <label className="flex gap-2 items-center text-sm">
                  <input
                    type="checkbox"
                    checked={deleteConfirmTwo}
                    onChange={(e) => setDeleteConfirmTwo(e.target.checked)}
                  />{' '}
                  Schedule my profile and learning data for deletion after 30 days.
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter password to confirm"
                  className="px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={deleteAccount}
                  disabled={isDeleting}
                  className="flex gap-2 items-center px-4 py-2 rounded-lg bg-destructive text-destructive-foreground disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />{' '}
                  {isDeleting ? 'Scheduling...' : 'Schedule deletion'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
