'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitOnboarding } from './actions'
import { User, Subject, AcademicLevel } from '@/payload-types'
import { Upload, Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import DatePicker from '@/components/DatePicker'

interface OnboardingFormProps {
  user: User
  academicLevels: AcademicLevel[]
  subjects: Subject[]
}

export default function OnboardingForm({ user, academicLevels, subjects }: OnboardingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<{
    phoneNumber: string
    dateOfBirth: string
    academicLevel: string
    subjects: string[]
    profilePic: File | null
  }>({
    phoneNumber: user.phoneNumber || '',
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    academicLevel: (requestLevel(user.academicLevel) as string) || '',
    subjects: [], // Users usually don't have subjects pre-filled at this stage
    profilePic: null,
  })

  // Helper to safely get ID from relationship
  function requestLevel(level: any): string | undefined {
    if (!level) return undefined
    if (typeof level === 'string') return level
    return level.id
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubjectToggle = (subjectId: string) => {
    setFormData((prev) => {
      const exists = prev.subjects.includes(subjectId)
      if (exists) {
        return { ...prev, subjects: prev.subjects.filter((id) => id !== subjectId) }
      } else {
        return { ...prev, subjects: [...prev.subjects, subjectId] }
      }
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, profilePic: e.target.files![0] }))
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      let profilePicId = undefined

      // Upload profile picture if selected
      if (formData.profilePic) {
        const data = new FormData()
        data.append('file', formData.profilePic)
        data.append('alt', `${user.firstName}'s Profile Picture`)

        const res = await fetch('/api/media', {
          method: 'POST',
          body: data,
        })

        if (!res.ok) throw new Error('Failed to upload image')

        const json = await res.json()
        profilePicId = json.doc.id
      }

      await submitOnboarding(user.id, {
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        academicLevel: formData.academicLevel,
        subjects: formData.subjects,
        profilePic: profilePicId,
      })

      toast.success('Onboarding complete!')
      // Redirect handled in server action, but we can also push here as backup
      // router.push('/dashboard')
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => setStep((p) => p + 1)
  const prevStep = () => setStep((p) => p - 1)

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
      {/* Progress Bar */}
      <div className="h-2 bg-muted w-full">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="p-8">
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">Tell us about yourself</h1>
              <p className="text-muted-foreground mt-2">
                Just a few details to get your profile ready.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="+237 699 999 999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Date of Birth
                </label>
                <DatePicker
                  value={formData.dateOfBirth}
                  onChange={(val) => setFormData((prev) => ({ ...prev, dateOfBirth: val }))}
                  captionLayout="dropdown-years"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={nextStep}
                disabled={!formData.phoneNumber || !formData.dateOfBirth}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">Academic Interests</h1>
              <p className="text-muted-foreground mt-2">
                Help us personalize your learning experience.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Academic Level
                </label>
                <select
                  name="academicLevel"
                  value={formData.academicLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="" disabled>
                    Select your level
                  </option>
                  {academicLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Subjects of Interest
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      onClick={() => handleSubjectToggle(subject.id)}
                      className={`
                        cursor-pointer p-3 rounded-lg border text-center transition-all duration-200 select-none
                        ${
                          formData.subjects.includes(subject.id)
                            ? 'bg-primary/10 border-primary text-primary shadow-sm'
                            : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:bg-accent'
                        }
                      `}
                    >
                      <span className="text-sm font-medium">{subject.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.academicLevel || formData.subjects.length === 0}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">Add a Photo</h1>
              <p className="text-muted-foreground mt-2">Make your profile stand out.</p>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-muted bg-muted flex items-center justify-center group">
                {formData.profilePic ? (
                  <img
                    src={URL.createObjectURL(formData.profilePic)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center">
                    <Upload className="w-8 h-8 mb-2" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-sm text-muted-foreground">Click to upload (optional)</p>
            </div>

            <div className="pt-8 flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-8 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Complete Setup <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
