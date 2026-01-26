'use client'

import React, { useState } from 'react'
import { AcademicLevel, Subject } from '@/payload-types'

export default function CreateForm({
  userId,
  levels,
  subjects,
}: {
  userId: string
  levels: AcademicLevel[]
  subjects: Subject[]
}) {
  const [goal, setGoal] = useState('')
  const [levelId, setLevelId] = useState('')
  const [subjectIds, setSubjectIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function toggleSubject(id: string) {
    setSubjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function stringToRichText(text: string) {
    return {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text,
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    }
  }

  async function submit() {
    setError('')
    setSuccess('')
    if (!userId || !levelId || subjectIds.length === 0) {
      setError('Select academic level and at least one subject.')
      return
    }
    setSaving(true)
    try {
      const body = {
        user: userId,
        academicLevel: levelId,
        goals: goal || '',
        subjects: subjectIds,
        isActive: true,
        planType: 'regular_study',
        notes: notes ? stringToRichText(notes) : undefined,
      }
      const res = await fetch('/api/study-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        let msg = 'Failed to create plan'
        try {
          const e = await res.json()
          msg = e?.message || e?.error || msg
        } catch {}
        throw new Error(msg)
      }
      setSuccess('Study plan created')
      setGoal('')
      setLevelId('')
      setSubjectIds([])
      setNotes('')
    } catch (e: any) {
      setError(e?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="block mb-1 text-sm text-muted-foreground">Academic Level</label>
          <select
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
            className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
          >
            <option value="">Select level</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {(l as any).name || l.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm text-muted-foreground">Study Goal</label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Improve algebra"
            className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block mb-1 text-sm text-muted-foreground">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes..."
            className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground min-h-[100px]"
          />
        </div>
      </div>
      <div>
        <label className="block mb-2 text-sm text-muted-foreground">Subjects</label>
        <div className="grid grid-cols-2 gap-2">
          {subjects.map((s) => {
            const checked = subjectIds.includes(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSubject(s.id)}
                className={`px-3 py-2 rounded-lg border ${checked ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border'}`}
              >
                {(s as any).name || s.id}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Create Plan'}
        </button>
        {error && <span className="text-sm text-destructive">{error}</span>}
        {success && (
          <span className="text-sm text-emerald-600 dark:text-emerald-300">{success}</span>
        )}
      </div>
    </div>
  )
}
