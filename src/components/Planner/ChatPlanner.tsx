'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AcademicLevel, Subject, Topic, StudyPlan } from '@/payload-types'
import { MessageSquare, Send, Wand2, CheckCircle2, Clock, BookOpen } from 'lucide-react'
import { DatePicker } from '@/components/DatePicker'
import BadgeSelect from '@/components/BadgeSelect'

type ChatPlannerProps = {
  userId: string
  academicLevels: AcademicLevel[]
  subjects: Subject[]
  topics: Topic[]
  initialPlan?: StudyPlan | null
}

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  text?: string
  node?: ReactNode
}

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(':').map((v) => parseInt(v, 10))
  const d = new Date()
  d.setHours(h, m, 0, 0)
  d.setMinutes(d.getMinutes() + minutes)
  const hh = `${d.getHours()}`.padStart(2, '0')
  const mm = `${d.getMinutes()}`.padStart(2, '0')
  return `${hh}:${mm}`
}

function timeForPreference(pref: NonNullable<StudyPlan['studyPreferences']>['preferredStudyTime']) {
  if (pref === 'early_morning') return '06:00'
  if (pref === 'morning') return '09:00'
  if (pref === 'afternoon') return '14:00'
  if (pref === 'evening') return '18:00'
  if (pref === 'night') return '20:00'
  return '22:00'
}

export default function ChatPlanner({
  userId,
  academicLevels,
  subjects,
  topics,
  initialPlan,
}: ChatPlannerProps) {
  const [academicLevelId, setAcademicLevelId] = useState<string | undefined>(
    (typeof initialPlan?.academicLevel === 'string'
      ? (initialPlan?.academicLevel as string)
      : (initialPlan?.academicLevel as any)?.id) || undefined,
  )
  const [planType, setPlanType] = useState<StudyPlan['planType']>(
    initialPlan?.planType || 'regular_study',
  )
  const [targetExamDate, setTargetExamDate] = useState<string>(initialPlan?.targetExamDate || '')
  const [subjectsIds, setSubjectsIds] = useState<string[]>(
    (initialPlan?.subjects || [])
      .map((s) => (typeof s === 'string' ? (s as string) : (s as any)?.id))
      .filter(Boolean) as string[],
  )
  const [preferences, setPreferences] = useState<NonNullable<StudyPlan['studyPreferences']>>(
    initialPlan?.studyPreferences || {
      preferredStudyTime: 'morning',
      sessionDuration: 60,
      breakDuration: 15,
      studyMethod: [],
      difficultyPreference: 'easy_first',
    },
  )
  const [generatedPlans, setGeneratedPlans] = useState<Array<Partial<StudyPlan>>>([])
  const [selectedPlanIdx, setSelectedPlanIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')

  const existingGuidance = useMemo(() => {
    const plan = initialPlan
    if (!plan || !(plan.weeklySchedule || []).length) return null
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const now = new Date()
    const today = days[now.getDay()]
    const todaySessions = (plan.weeklySchedule || []).filter(
      (s) => s.isActive && s.dayOfWeek === today,
    )
    const next = todaySessions[0] || (plan.weeklySchedule || []).find((s) => s.isActive) || null
    if (!next) return null
    const subjectId = typeof next.subject === 'string' ? next.subject : (next.subject as any)?.id
    const topicsArray = Array.isArray(next.topics) ? next.topics : []
    const firstTopic = topicsArray[0]
    const topicId = firstTopic
      ? typeof firstTopic === 'string'
        ? firstTopic
        : (firstTopic as any)?.id
      : ''
    return {
      subjectId,
      topicId,
      sessionType: next.sessionType,
      startTime: next.startTime,
      dayOfWeek: next.dayOfWeek,
    }
  }, [initialPlan])

  function pushAssistant(text?: string, node?: ReactNode) {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${prev.length}`, role: 'assistant', text, node },
    ])
  }
  function pushUser(text?: string, node?: ReactNode) {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${prev.length}`, role: 'user', text, node },
    ])
  }

  function startFlow() {
    pushAssistant(
      'Let’s set up a study plan together. I’ll ask a few quick questions and generate options for you to choose.',
    )
    pushAssistant(
      undefined,
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Pick your academic level</p>
        <div className="grid grid-cols-2 gap-2">
          {academicLevels.map((l) => (
            <button
              key={l.id as string}
              type="button"
              onClick={() => handleLevelSelect(l.id as string)}
              className={`px-3 py-2 rounded-lg border ${academicLevelId === (l.id as string) ? 'bg-primary text-primary-foreground' : 'bg-input border-border text-foreground'}`}
            >
              {(l as any).name || (l.id as string)}
            </button>
          ))}
        </div>
      </div>,
    )
  }

  function handleLevelSelect(id: string) {
    setAcademicLevelId(id)
    pushUser(`Selected level: ${id}`)
    pushAssistant(
      undefined,
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">What type of plan suits you?</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: 'regular_study', label: 'Regular Study' },
            { v: 'exam_prep', label: 'Exam Prep' },
            { v: 'revision', label: 'Revision' },
            { v: 'catch_up', label: 'Catch Up' },
            { v: 'advanced', label: 'Advanced' },
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => handlePlanTypeSelect(opt.v as StudyPlan['planType'])}
              className={`px-3 py-2 rounded-lg border ${planType === (opt.v as any) ? 'bg-primary text-primary-foreground' : 'bg-input border-border text-foreground'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>,
    )
  }

  function handlePlanTypeSelect(v: StudyPlan['planType']) {
    setPlanType(v)
    pushUser(`Plan type: ${v}`)
    if (v === 'exam_prep') {
      pushAssistant(
        undefined,
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Select your target exam date</p>
          <div className="flex gap-2 items-center">
            <DatePicker
              value={targetExamDate || ''}
              onChange={(d) => {
                setTargetExamDate(d)
                pushUser(`Exam date set`)
                askSubjects()
              }}
              captionLayout="dropdown"
              fromYear={new Date().getFullYear() - 2}
              toYear={new Date().getFullYear() + 2}
            />
          </div>
        </div>,
      )
    } else {
      askSubjects()
    }
  }

  function askSubjects() {
    pushAssistant(
      undefined,
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Pick subjects to include</p>
        <BadgeSelect
          ariaLabel="Select plan subjects"
          options={subjects.map((s) => ({
            value: s.id as string,
            label: (s as any).name || (s.id as string),
          }))}
          selected={subjectsIds}
          onChange={(next) => {
            setSubjectsIds(next)
            pushUser(`Selected ${next.length} subject(s)`)
            askPreferences()
          }}
        />
      </div>,
    )
  }

  function askPreferences() {
    pushAssistant(
      undefined,
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Tell me your preferences</p>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block mb-1 text-sm text-muted-foreground">Preferred Study Time</label>
            <select
              value={preferences.preferredStudyTime || ''}
              onChange={(e) =>
                setPreferences({ ...preferences, preferredStudyTime: e.target.value as any })
              }
              className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
            >
              <option value="early_morning">Early Morning</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
              <option value="late_night">Late Night</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1 text-sm text-muted-foreground">Session Duration</label>
              <input
                type="number"
                value={preferences.sessionDuration || 60}
                onChange={(e) =>
                  setPreferences({ ...preferences, sessionDuration: Number(e.target.value) })
                }
                className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm text-muted-foreground">Break Duration</label>
              <input
                type="number"
                value={preferences.breakDuration || 15}
                onChange={(e) =>
                  setPreferences({ ...preferences, breakDuration: Number(e.target.value) })
                }
                className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm text-muted-foreground">Study Methods</label>
            <BadgeSelect
              ariaLabel="Select preferred study methods"
              options={[
                { value: 'reading', label: 'Reading' },
                { value: 'video', label: 'Video Learning' },
                { value: 'practice', label: 'Practice Questions' },
                { value: 'notes', label: 'Note Taking' },
                { value: 'group', label: 'Group Study' },
                { value: 'flashcards', label: 'Flashcards' },
              ]}
              selected={(preferences.studyMethod || []) as string[]}
              onChange={(next) => setPreferences({ ...preferences, studyMethod: next as any })}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-muted-foreground">
              Difficulty Preference
            </label>
            <select
              value={preferences.difficultyPreference || 'easy_first'}
              onChange={(e) =>
                setPreferences({ ...preferences, difficultyPreference: e.target.value as any })
              }
              className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
            >
              <option value="easy_first">Start Easy</option>
              <option value="hard_first">Start Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <button
            type="button"
            onClick={generateOptions}
            className="px-4 py-3 mt-2 rounded-lg bg-primary text-primary-foreground"
          >
            Generate Plan Options
          </button>
        </div>
      </div>,
    )
  }

  function generateOptions() {
    pushUser('Generate plan options')
    const start = timeForPreference(preferences.preferredStudyTime || 'morning')
    const baseDaysBalanced = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    const baseDaysFocused = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const baseDaysLight = ['monday', 'wednesday', 'friday']
    const sd = preferences.sessionDuration || 60
    const subjectsCycle = subjectsIds.length
      ? subjectsIds
      : [subjects[0]?.id as string].filter(Boolean)
    function sessionsFor(days: string[], perDay: number) {
      const out: NonNullable<StudyPlan['weeklySchedule']> = []
      let si = 0
      for (const d of days) {
        for (let i = 0; i < perDay; i++) {
          const st = addMinutes(start, i * (sd + (preferences.breakDuration || 15)))
          const et = addMinutes(st, sd)
          const subj = subjectsCycle[si % subjectsCycle.length]
          out.push({
            dayOfWeek: d as any,
            startTime: st,
            endTime: et,
            subject: subj,
            topics: [],
            sessionType: 'study',
            isActive: true,
          })
          si++
        }
      }
      return out
    }
    const balanced: Partial<StudyPlan> = {
      planType,
      academicLevel: academicLevelId,
      targetExamDate: targetExamDate || undefined,
      goals: `Balanced plan covering ${subjectsCycle.length} subject(s)`,
      subjects: subjectsCycle,
      weeklySchedule: sessionsFor(baseDaysBalanced, 1),
      studyGoals: [],
      milestones: [],
      studyReminders: [],
      studyPreferences: preferences,
      timetable: [],
      isActive: true,
    }
    const focused: Partial<StudyPlan> = {
      planType,
      academicLevel: academicLevelId,
      targetExamDate: targetExamDate || undefined,
      goals: `Focused plan with 2 sessions/day`,
      subjects: subjectsCycle,
      weeklySchedule: sessionsFor(baseDaysFocused, 2),
      studyGoals: [],
      milestones: [],
      studyReminders: [],
      studyPreferences: preferences,
      timetable: [],
      isActive: true,
    }
    const light: Partial<StudyPlan> = {
      planType,
      academicLevel: academicLevelId,
      targetExamDate: targetExamDate || undefined,
      goals: `Light plan, 3 sessions/week`,
      subjects: subjectsCycle,
      weeklySchedule: sessionsFor(baseDaysLight, 1),
      studyGoals: [],
      milestones: [],
      studyReminders: [],
      studyPreferences: preferences,
      timetable: [],
      isActive: true,
    }
    const variants = [balanced, focused, light]
    setGeneratedPlans(variants)
    setSelectedPlanIdx(0)
    pushAssistant(
      undefined,
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Here are some plan options. Pick one to preview.
        </p>
        <div className="grid grid-cols-1 gap-3">
          {variants.map((v, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedPlanIdx(idx)}
              className={`text-left p-3 rounded-lg border ${selectedPlanIdx === idx ? 'bg-primary text-primary-foreground' : 'bg-input border-border text-foreground'}`}
            >
              {(v.goals as string) || 'Plan'}
              <p className="mt-1 text-xs opacity-80">Sessions: {(v.weeklySchedule || []).length}</p>
            </button>
          ))}
        </div>
      </div>,
    )
    pushAssistant(
      undefined,
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={confirmAndSave}
          disabled={selectedPlanIdx == null}
          className="px-4 py-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
        >
          Confirm and Save
        </button>
      </div>,
    )
  }

  async function confirmAndSave() {
    if (selectedPlanIdx == null) return
    setSaving(true)
    setStatusMessage('')
    const chosen = generatedPlans[selectedPlanIdx]
    const payload = {
      academicLevel: chosen.academicLevel || academicLevelId,
      planType: chosen.planType || planType,
      targetExamDate: chosen.targetExamDate || undefined,
      goals: chosen.goals || undefined,
      subjects: chosen.subjects || subjectsIds,
      weeklySchedule: chosen.weeklySchedule || [],
      studyGoals: chosen.studyGoals || [],
      milestones: chosen.milestones || [],
      studyReminders: chosen.studyReminders || [],
      studyPreferences: chosen.studyPreferences || preferences,
      timetable: chosen.timetable || [],
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
        pushAssistant('Your plan is saved. You can start following it today.')
      }
    } catch {
      setStatusMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const msgs: ChatMessage[] = []
    if (initialPlan?.isActive) {
      if (existingGuidance) {
        msgs.push({
          id: 'guidance',
          role: 'assistant',
          node: (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You have an active plan. Next session: {existingGuidance.dayOfWeek}{' '}
                {existingGuidance.startTime}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={`/dashboard/learning${existingGuidance.subjectId ? `/${existingGuidance.subjectId}${existingGuidance.topicId ? `/${existingGuidance.topicId}` : ''}` : ''}`}
                  className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                >
                  <BookOpen className="w-4 h-4" /> Learning
                </a>
                <a
                  href={`/dashboard/testing/practice`}
                  className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                >
                  <CheckCircle2 className="w-4 h-4" /> Practice
                </a>
                <a
                  href={`/dashboard/videos`}
                  className="flex gap-2 items-center px-3 py-2 rounded-lg border bg-input border-border text-foreground"
                >
                  <Clock className="w-4 h-4" /> Videos
                </a>
              </div>
            </div>
          ),
        })
      }
    }
    setMessages(msgs)
    startFlow()
  }, [])

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border bg-card border-border">
        <div className="flex gap-2 items-center mb-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <p className="font-medium text-foreground">Interactive Planner</p>
        </div>
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[90%] rounded-2xl px-3 py-2 ${m.role === 'assistant' ? 'bg-input text-foreground' : 'bg-primary text-primary-foreground ml-auto'}`}
            >
              {m.text && <p className="text-sm">{m.text}</p>}
              {m.node}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or preference..."
            className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
          />
          <button
            type="button"
            onClick={() => {
              if (!inputText.trim()) return
              pushUser(inputText.trim())
              setInputText('')
            }}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
      {generatedPlans.length > 0 && selectedPlanIdx != null && (
        <div className="p-4 rounded-2xl border bg-card border-border">
          <div className="flex gap-2 items-center mb-2">
            <Wand2 className="w-4 h-4 text-primary" />
            <p className="font-medium text-foreground">Selected Plan Preview</p>
          </div>
          <div className="space-y-2">
            {(generatedPlans[selectedPlanIdx].weeklySchedule || []).map((s, i) => (
              <div
                key={`${s?.dayOfWeek}-${s?.startTime}-${i}`}
                className="p-3 rounded-lg border bg-input border-border"
              >
                <p className="text-sm font-medium text-foreground">
                  {s?.dayOfWeek} • {s?.startTime}–{s?.endTime}
                </p>
                <p className="text-sm text-muted-foreground">
                  {typeof s?.subject === 'string' ? s?.subject : (s?.subject as any) || 'Subject'}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-center mt-3">
            <button
              type="button"
              onClick={confirmAndSave}
              disabled={saving}
              className="px-4 py-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Confirm and Save'}
            </button>
            {statusMessage && (
              <span className="text-sm text-muted-foreground">{statusMessage}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
