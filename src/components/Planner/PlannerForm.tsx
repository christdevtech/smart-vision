'use client'

import { useEffect, useMemo, useState } from 'react'
import { AcademicLevel, Subject, Topic, StudyPlan } from '@/payload-types'
import { Calendar, Target, Clock, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { DatePicker } from '@/components/DatePicker'

type WeeklySession = NonNullable<StudyPlan['weeklySchedule']>[number]
type StudyGoal = NonNullable<StudyPlan['studyGoals']>[number]
type Milestone = NonNullable<StudyPlan['milestones']>[number]
type Reminder = NonNullable<StudyPlan['studyReminders']>[number]
type TimetableItem = NonNullable<StudyPlan['timetable']>[number]

type PlannerFormProps = {
  userId: string
  academicLevels: AcademicLevel[]
  subjects: Subject[]
  topics: Topic[]
  initialPlan?: StudyPlan | null
}

export default function PlannerForm({
  userId,
  academicLevels,
  subjects,
  topics,
  initialPlan,
}: PlannerFormProps) {
  const [planType, setPlanType] = useState<StudyPlan['planType']>(
    initialPlan?.planType || 'regular_study',
  )
  const [academicLevelId, setAcademicLevelId] = useState<string | undefined>(
    (typeof initialPlan?.academicLevel === 'string'
      ? (initialPlan?.academicLevel as string)
      : (initialPlan?.academicLevel as any)?.id) || undefined,
  )
  const [targetExamDate, setTargetExamDate] = useState<string>(initialPlan?.targetExamDate || '')
  const [goalsText, setGoalsText] = useState(initialPlan?.goals || '')
  const [subjectsIds, setSubjectsIds] = useState<string[]>(
    (initialPlan?.subjects || [])
      .map((s) => (typeof s === 'string' ? (s as string) : (s as any)?.id))
      .filter(Boolean) as string[],
  )
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySession[]>(
    initialPlan?.weeklySchedule || [],
  )
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>(initialPlan?.studyGoals || [])
  const [milestones, setMilestones] = useState<Milestone[]>(initialPlan?.milestones || [])
  const [reminders, setReminders] = useState<Reminder[]>(initialPlan?.studyReminders || [])
  const [timetable, setTimetable] = useState<TimetableItem[]>(initialPlan?.timetable || [])

  const [preferences, setPreferences] = useState<NonNullable<StudyPlan['studyPreferences']>>(
    initialPlan?.studyPreferences || {
      preferredStudyTime: 'morning',
      sessionDuration: 60,
      breakDuration: 15,
      studyMethod: [],
      difficultyPreference: 'easy_first',
    },
  )

  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  function addWeeklySession() {
    const newItem: WeeklySession = {
      dayOfWeek: 'monday',
      startTime: '09:00',
      endTime: '10:00',
      subject: subjects[0]?.id || '',
      topics: [],
      sessionType: 'study',
      isActive: true,
    }
    setWeeklySchedule((prev) => [...prev, newItem])
  }

  function updateWeeklySession(index: number, next: Partial<WeeklySession>) {
    setWeeklySchedule((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...next }
      return copy
    })
  }

  function removeWeeklySession(index: number) {
    setWeeklySchedule((prev) => prev.filter((_, i) => i !== index))
  }

  function addStudyGoal() {
    const newGoal: StudyGoal = {
      title: '',
      description: '',
      subject: subjects[0]?.id || '',
      targetDate: '',
      priority: 'medium',
      status: 'not_started',
      progress: 0,
    }
    setStudyGoals((prev) => [...prev, newGoal])
  }

  function updateStudyGoal(index: number, next: Partial<StudyGoal>) {
    setStudyGoals((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...next }
      return copy
    })
  }

  function removeStudyGoal(index: number) {
    setStudyGoals((prev) => prev.filter((_, i) => i !== index))
  }

  function addMilestone() {
    const newMilestone: Milestone = {
      title: '',
      description: '',
      targetDate: '',
      subjects: [],
      isCompleted: false,
      reward: '',
    }
    setMilestones((prev) => [...prev, newMilestone])
  }

  function updateMilestone(index: number, next: Partial<Milestone>) {
    setMilestones((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...next }
      return copy
    })
  }

  function removeMilestone(index: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== index))
  }

  function addReminder() {
    const newReminder: Reminder = {
      title: '',
      message: '',
      reminderTime: '',
      reminderType: 'study_session',
      isRecurring: false,
      isActive: true,
      isSent: false,
    }
    setReminders((prev) => [...prev, newReminder])
  }

  function updateReminder(index: number, next: Partial<Reminder>) {
    setReminders((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...next }
      return copy
    })
  }

  function removeReminder(index: number) {
    setReminders((prev) => prev.filter((_, i) => i !== index))
  }

  function addTimetableItem() {
    const item: TimetableItem = {
      day: '',
      session: '',
      subject: subjects[0]?.id || '',
    }
    setTimetable((prev) => [...prev, item])
  }

  function updateTimetableItem(index: number, next: Partial<TimetableItem>) {
    setTimetable((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...next }
      return copy
    })
  }

  function removeTimetableItem(index: number) {
    setTimetable((prev) => prev.filter((_, i) => i !== index))
  }

  async function savePlan() {
    setSaving(true)
    setStatusMessage('')
    const payload = {
      academicLevel: academicLevelId,
      planType,
      targetExamDate: targetExamDate || undefined,
      goals: goalsText || undefined,
      subjects: subjectsIds,
      weeklySchedule,
      studyGoals,
      milestones,
      studyReminders: reminders,
      studyPreferences: preferences,
      timetable,
      isActive: true,
    }
    try {
      const res = await fetch('/api/custom/study-plans/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        setStatusMessage('Failed to save study plan')
      } else {
        setStatusMessage('Study plan saved')
      }
    } catch (e) {
      setStatusMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border bg-card border-border">
        <div className="flex gap-2 items-center mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <p className="font-medium text-foreground">Plan Basics</p>
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
            <label className="block mb-2 text-sm text-muted-foreground">Plan Type</label>
            <select
              value={planType || 'regular_study'}
              onChange={(e) => setPlanType(e.target.value as any)}
              className="px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="regular_study">Regular Study</option>
              <option value="exam_prep">Exam Preparation</option>
              <option value="revision">Revision</option>
              <option value="catch_up">Catch Up</option>
              <option value="advanced">Advanced Learning</option>
            </select>
          </div>
        </div>
        {planType === 'exam_prep' && (
          <div className="mt-4">
            <label className="block mb-2 text-sm text-muted-foreground">Target Exam Date</label>
            <DatePicker
              value={targetExamDate || ''}
              onChange={(v) => setTargetExamDate(v)}
              captionLayout="dropdown"
              fromYear={new Date().getFullYear() - 2}
              toYear={new Date().getFullYear() + 2}
            />
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl border bg-card border-border">
        <div className="flex gap-2 items-center mb-3">
          <Target className="w-4 h-4 text-primary" />
          <p className="font-medium text-foreground">Subjects & Goals</p>
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm text-muted-foreground">Subjects</label>
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((s) => {
              const id = s.id as string
              const checked = subjectsIds.includes(id)
              return (
                <label key={id} className="flex gap-2 items-center text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setSubjectsIds((prev) =>
                        e.target.checked ? [...prev, id] : prev.filter((x) => x !== id),
                      )
                    }}
                  />
                  {(s as any).name || id}
                </label>
              )
            })}
          </div>
        </div>
        <div>
          <label className="block mb-2 text-sm text-muted-foreground">Overall Goals</label>
          <textarea
            value={goalsText}
            onChange={(e) => setGoalsText(e.target.value)}
            className="px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={4}
            placeholder="Describe your study goals"
          />
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-card border-border">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2 items-center">
            <Clock className="w-4 h-4 text-primary" />
            <p className="font-medium text-foreground">Weekly Schedule</p>
          </div>
          <button
            type="button"
            onClick={addWeeklySession}
            className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-secondary border-border text-foreground"
          >
            <Plus className="w-4 h-4" /> Add Session
          </button>
        </div>
        <div className="space-y-3">
          {weeklySchedule.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select
                value={item.dayOfWeek}
                onChange={(e) => updateWeeklySession(idx, { dayOfWeek: e.target.value as any })}
                className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
              >
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={item.startTime}
                  onChange={(e) => updateWeeklySession(idx, { startTime: e.target.value })}
                  placeholder="Start 09:00"
                  className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                />
                <input
                  value={item.endTime}
                  onChange={(e) => updateWeeklySession(idx, { endTime: e.target.value })}
                  placeholder="End 10:00"
                  className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={item.subject as any}
                  onChange={(e) => updateWeeklySession(idx, { subject: e.target.value })}
                  className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                >
                  {subjects.map((s) => (
                    <option key={s.id as string} value={s.id as string}>
                      {(s as any).name || (s.id as string)}
                    </option>
                  ))}
                </select>
                <select
                  multiple
                  value={
                    (item.topics || []).map((t) =>
                      typeof t === 'string' ? t : (t as any)?.id,
                    ) as any
                  }
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map((o) => o.value)
                    updateWeeklySession(idx, { topics: opts })
                  }}
                  className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                >
                  {topics.map((t) => (
                    <option key={t.id as string} value={t.id as string}>
                      {(t as any).name || (t.id as string)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 md:col-span-3">
                <select
                  value={item.sessionType || 'study'}
                  onChange={(e) => updateWeeklySession(idx, { sessionType: e.target.value as any })}
                  className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                >
                  <option value="study">Study</option>
                  <option value="practice">Practice</option>
                  <option value="revision">Revision</option>
                  <option value="test">Test</option>
                </select>
                <label className="flex gap-2 items-center text-sm">
                  <input
                    type="checkbox"
                    checked={item.isActive ?? true}
                    onChange={(e) => updateWeeklySession(idx, { isActive: e.target.checked })}
                  />
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => removeWeeklySession(idx)}
                  className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-destructive text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-card border-border">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2 items-center">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <p className="font-medium text-foreground">Study Goals</p>
          </div>
          <button
            type="button"
            onClick={addStudyGoal}
            className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-secondary border-border text-foreground"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        </div>
        <div className="space-y-3">
          {studyGoals.map((g, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                value={g.title || ''}
                onChange={(e) => updateStudyGoal(idx, { title: e.target.value })}
                placeholder="Title"
                className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
              />
              <select
                value={g.subject as any}
                onChange={(e) => updateStudyGoal(idx, { subject: e.target.value })}
                className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
              >
                {subjects.map((s) => (
                  <option key={s.id as string} value={s.id as string}>
                    {(s as any).name || (s.id as string)}
                  </option>
                ))}
              </select>
              <DatePicker
                value={g.targetDate || ''}
                onChange={(v) => updateStudyGoal(idx, { targetDate: v })}
                captionLayout="dropdown"
                fromYear={new Date().getFullYear() - 1}
                toYear={new Date().getFullYear() + 1}
              />
              <textarea
                value={g.description || ''}
                onChange={(e) => updateStudyGoal(idx, { description: e.target.value })}
                placeholder="Description"
                className="px-3 py-2 rounded-lg border bg-input border-border text-foreground md:col-span-2"
              />
              <div className="grid grid-cols-3 gap-2 md:col-span-3">
                <select
                  value={g.priority || 'medium'}
                  onChange={(e) => updateStudyGoal(idx, { priority: e.target.value as any })}
                  className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={g.status || 'not_started'}
                  onChange={(e) => updateStudyGoal(idx, { status: e.target.value as any })}
                  className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeStudyGoal(idx)}
                  className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-destructive text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-card border-border">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2 items-center">
            <Calendar className="w-4 h-4 text-primary" />
            <p className="font-medium text-foreground">Milestones</p>
          </div>
          <button
            type="button"
            onClick={addMilestone}
            className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-secondary border-border text-foreground"
          >
            <Plus className="w-4 h-4" /> Add Milestone
          </button>
        </div>
        <div className="space-y-3">
          {milestones.map((m, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                value={m.title || ''}
                onChange={(e) => updateMilestone(idx, { title: e.target.value })}
                placeholder="Title"
                className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
              />
              <DatePicker
                value={m.targetDate || ''}
                onChange={(v) => updateMilestone(idx, { targetDate: v })}
                captionLayout="dropdown"
                fromYear={new Date().getFullYear() - 1}
                toYear={new Date().getFullYear() + 2}
              />
              <div className="grid grid-cols-1 gap-2">
                <label className="block mb-1 text-sm text-muted-foreground">Subjects</label>
                <select
                  multiple
                  value={
                    (m.subjects || []).map((s) =>
                      typeof s === 'string' ? s : (s as any)?.id,
                    ) as any
                  }
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map((o) => o.value)
                    updateMilestone(idx, { subjects: opts })
                  }}
                  className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                >
                  {subjects.map((s) => (
                    <option key={s.id as string} value={s.id as string}>
                      {(s as any).name || (s.id as string)}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={m.description || ''}
                onChange={(e) => updateMilestone(idx, { description: e.target.value })}
                placeholder="Description"
                className="px-3 py-2 rounded-lg border bg-input border-border text-foreground md:col-span-2"
              />
              <div className="grid grid-cols-3 gap-2 md:col-span-3">
                <label className="flex gap-2 items-center text-sm">
                  <input
                    type="checkbox"
                    checked={m.isCompleted ?? false}
                    onChange={(e) => updateMilestone(idx, { isCompleted: e.target.checked })}
                  />
                  Completed
                </label>
                <input
                  value={m.reward || ''}
                  onChange={(e) => updateMilestone(idx, { reward: e.target.value })}
                  placeholder="Reward"
                  className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                />
                <button
                  type="button"
                  onClick={() => removeMilestone(idx)}
                  className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-destructive text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-card border-border">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2 items-center">
            <Clock className="w-4 h-4 text-primary" />
            <p className="font-medium text-foreground">Reminders</p>
          </div>
          <button
            type="button"
            onClick={addReminder}
            className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-secondary border-border text-foreground"
          >
            <Plus className="w-4 h-4" /> Add Reminder
          </button>
        </div>
        <div className="space-y-3">
          {reminders.map((r, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                value={r.title || ''}
                onChange={(e) => updateReminder(idx, { title: e.target.value })}
                placeholder="Title"
                className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
              />
              <select
                value={r.reminderType || 'study_session'}
                onChange={(e) => updateReminder(idx, { reminderType: e.target.value as any })}
                className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
              >
                <option value="study_session">Study Session</option>
                <option value="assignment_due">Assignment Due</option>
                <option value="exam_reminder">Exam Reminder</option>
                <option value="goal_deadline">Goal Deadline</option>
                <option value="custom">Custom</option>
              </select>
              <DatePicker
                value={r.reminderTime || ''}
                onChange={(v) => updateReminder(idx, { reminderTime: v })}
                captionLayout="dropdown"
                fromYear={new Date().getFullYear() - 1}
                toYear={new Date().getFullYear() + 1}
              />
              <textarea
                value={r.message || ''}
                onChange={(e) => updateReminder(idx, { message: e.target.value })}
                placeholder="Message"
                className="px-3 py-2 rounded-lg border bg-input border-border text-foreground md:col-span-2"
              />
              <div className="grid grid-cols-3 gap-2 md:col-span-3">
                <label className="flex gap-2 items-center text-sm">
                  <input
                    type="checkbox"
                    checked={r.isRecurring ?? false}
                    onChange={(e) => updateReminder(idx, { isRecurring: e.target.checked })}
                  />
                  Recurring
                </label>
                <select
                  value={r.recurrencePattern || ''}
                  onChange={(e) =>
                    updateReminder(idx, { recurrencePattern: e.target.value as any })
                  }
                  className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                >
                  <option value="">Select pattern</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeReminder(idx)}
                  className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-destructive text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-card border-border">
        <div className="flex gap-2 items-center mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <p className="font-medium text-foreground">One-off Timetable</p>
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={addTimetableItem}
            className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-secondary border-border text-foreground"
          >
            <Plus className="w-4 h-4" /> Add Session
          </button>
          {timetable.map((t, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <DatePicker
                value={t.day || ''}
                onChange={(v) => updateTimetableItem(idx, { day: v })}
                captionLayout="dropdown"
                fromYear={new Date().getFullYear() - 1}
                toYear={new Date().getFullYear() + 2}
              />
              <input
                value={t.session || ''}
                onChange={(e) => updateTimetableItem(idx, { session: e.target.value })}
                placeholder="Session details"
                className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
              />
              <select
                value={t.subject as any}
                onChange={(e) => updateTimetableItem(idx, { subject: e.target.value })}
                className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
              >
                {subjects.map((s) => (
                  <option key={s.id as string} value={s.id as string}>
                    {(s as any).name || (s.id as string)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeTimetableItem(idx)}
                className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-destructive text-destructive-foreground md:col-span-3"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-card border-border">
        <div className="flex gap-2 items-center mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <p className="font-medium text-foreground">Preferences</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={preferences.preferredStudyTime || ''}
            onChange={(e) =>
              setPreferences({ ...preferences, preferredStudyTime: e.target.value as any })
            }
            className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
          >
            <option value="early_morning">Early Morning</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
            <option value="late_night">Late Night</option>
          </select>
          <input
            type="number"
            value={preferences.sessionDuration || 60}
            onChange={(e) =>
              setPreferences({ ...preferences, sessionDuration: Number(e.target.value) })
            }
            placeholder="Session minutes"
            className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
          />
          <input
            type="number"
            value={preferences.breakDuration || 15}
            onChange={(e) =>
              setPreferences({ ...preferences, breakDuration: Number(e.target.value) })
            }
            placeholder="Break minutes"
            className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
          />
          <select
            multiple
            value={(preferences.studyMethod || []) as any}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map((o) => o.value)
              setPreferences({ ...preferences, studyMethod: opts as any })
            }}
            className="px-3 py-2 rounded-lg border bg-input border-border text-foreground md:col-span-2"
          >
            <option value="reading">Reading</option>
            <option value="video">Video Learning</option>
            <option value="practice">Practice Questions</option>
            <option value="notes">Note Taking</option>
            <option value="group">Group Study</option>
            <option value="flashcards">Flashcards</option>
          </select>
          <select
            value={preferences.difficultyPreference || 'easy_first'}
            onChange={(e) =>
              setPreferences({ ...preferences, difficultyPreference: e.target.value as any })
            }
            className="px-3 py-2 rounded-lg border bg-input border-border text-foreground"
          >
            <option value="easy_first">Start Easy</option>
            <option value="hard_first">Start Hard</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={savePlan}
          disabled={saving || !academicLevelId}
          className="px-4 py-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Plan'}
        </button>
        {statusMessage && <span className="text-sm text-muted-foreground">{statusMessage}</span>}
      </div>
    </div>
  )
}
