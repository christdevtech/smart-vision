'use client'

import React from 'react'
import { FileText, Minus, Plus } from 'lucide-react'
import type { Subject, TestResult, Topic, User } from '@/payload-types'
import type { PublicTestQuestion } from '@/services/testScoring'
import type { TestResultResponse } from '@/services/testSessionService'
import RichText from '../RichText'

function getId(val: string | { id: string } | undefined | null) {
  if (!val) return ''
  if (typeof val === 'string') return val
  return (val as any).id || ''
}

const QUESTION_PRESETS = [5, 10, 20, 30, 50]

export default function TestingCenterClient({
  user,
  subscriptionActive,
  subjects,
  topics,
}: {
  user: User
  subscriptionActive: boolean
  subjects: Subject[]
  topics: Topic[]
}) {
  const academicLevelId = getId(user.academicLevel) || ''
  const [subjectId, setSubjectId] = React.useState<string>('')
  const [topicId, setTopicId] = React.useState<string>('')
  const [difficulty, setDifficulty] = React.useState<'easy' | 'medium' | 'hard' | ''>('')
  const [availableTopics, setAvailableTopics] = React.useState<Topic[]>([])
  const [numQuestions, setNumQuestions] = React.useState<number>(20)
  const [showConfirm, setShowConfirm] = React.useState(false)

  const [questions, setQuestions] = React.useState<PublicTestQuestion[]>([])
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [selections, setSelections] = React.useState<Record<string, string>>({})
  const [submitted, setSubmitted] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [averageScore, setAverageScore] = React.useState<number | null>(null)
  const [result, setResult] = React.useState<TestResultResponse | null>(null)

  React.useEffect(() => {
    const t = topics.filter((t) => (t.subjects || []).some((s) => getId(s) === subjectId))
    setAvailableTopics(t)
    if (topicId && !t.find((x) => x.id === topicId)) {
      setTopicId('')
    }
  }, [subjectId, topics])

  // Persist config to localStorage
  React.useEffect(() => {
    const key = 'testing-config'
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null')
      if (saved && saved.userId === user.id) {
        setSubjectId(saved.subjectId || '')
        setTopicId(saved.topicId || '')
        setDifficulty(saved.difficulty || '')
        if (typeof saved.numQuestions === 'number' && saved.numQuestions > 0) {
          setNumQuestions(saved.numQuestions)
        }
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    const key = 'testing-config'
    const payload = {
      userId: user.id,
      academicLevelId,
      subjectId,
      topicId,
      difficulty,
      numQuestions,
    }
    try {
      localStorage.setItem(key, JSON.stringify(payload))
    } catch {}
  }, [user.id, academicLevelId, subjectId, topicId, difficulty, numQuestions])

  async function fetchAverageScore(subjectIdArg: string, levelIdArg: string) {
    try {
      const res = await fetch(
        `/api/test-results?limit=20&where[subject][equals]=${encodeURIComponent(subjectIdArg)}&where[academicLevel][equals]=${encodeURIComponent(levelIdArg)}`,
      )
      if (!res.ok) return
      const data = await res.json()
      const docs: TestResult[] = data?.docs || []
      if (docs.length) {
        const avg = docs.reduce((sum, d) => sum + (d.scorePercentage || 0), 0) / docs.length
        setAverageScore(Math.round(avg))
      }
    } catch {}
  }

  async function startTest() {
    setError('')
    setSubmitted(false)
    setResult(null)
    setSessionId(null)
    setSelections({})
    setQuestions([])
    setCurrentIndex(0)

    if (!subscriptionActive) {
      setError('Active subscription required to start a test.')
      return
    }
    if (!academicLevelId || !subjectId) {
      setError('Select academic level and subject to start.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/custom/tests/start', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          ...(topicId ? { topicId } : {}),
          ...(difficulty ? { difficulty } : {}),
          numQuestions,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to start test')
      setQuestions(data.questions || [])
      setSessionId(data.sessionId)
      await fetchAverageScore(subjectId, academicLevelId)
    } catch (e: any) {
      setError(e?.message || 'Failed to start test')
    } finally {
      setLoading(false)
    }
  }

  function selectAnswer(qid: string, optionId: string) {
    setSelections((prev) => ({ ...prev, [qid]: optionId }))
  }

  function nextQuestion() {
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))
  }
  function prevQuestion() {
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }

  async function finalizeSubmit() {
    if (!questions.length || !sessionId) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/custom/tests/submit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answers: questions.map((question) => ({
            questionId: question.id,
            selectedOptionId: selections[question.id] || null,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit test')
      }
      setResult(data)
      setSubmitted(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to submit test')
    } finally {
      setSaving(false)
    }
  }

  function submitTest() {
    if (!questions.length) return
    setShowConfirm(true)
  }

  const canStart = !!academicLevelId && !!subjectId && subscriptionActive

  const current = questions[currentIndex]
  const progress = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0

  return (
    <div className="space-y-6">
      {!subscriptionActive && (
        <div className="flex justify-between items-center p-3 rounded-xl border bg-card border-border">
          <p className="text-sm text-muted-foreground">
            You need an active subscription to access tests.
          </p>
          <a
            href="/dashboard/subscriptions"
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Subscribe
          </a>
        </div>
      )}

      <div
        className={`p-4 rounded-2xl border ${subscriptionActive ? 'bg-card border-border/50' : 'opacity-60 bg-muted border-border/30'}`}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2 items-center">
            <FileText className="w-4 h-4 text-primary" />
            <p className="font-medium text-foreground">Practice Configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Academic Level UI removed — context is handled globally */}
          <div>
            <label className="block mb-1 text-sm text-muted-foreground">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s as any).name || s.id}
                </option>
              ))}
            </select>
          </div>

          {/* Number of Questions — mobile-friendly preset buttons + stepper */}
          <div className="md:col-span-2">
            <label className="block mb-2 text-sm text-muted-foreground">
              Number of Questions
            </label>
            {/* Quick-pick presets */}
            <div className="flex flex-wrap gap-2 mb-2">
              {QUESTION_PRESETS.map((n) => (
                <button
                  key={n}
                  onClick={() => setNumQuestions(n)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors
                    ${
                      numQuestions === n
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-foreground border-border hover:bg-accent'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {/* Fine-tune stepper */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNumQuestions((n) => Math.max(1, n - 1))}
                className="w-10 h-10 rounded-xl border bg-secondary border-border text-foreground text-lg font-bold flex items-center justify-center active:scale-95 transition-transform"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-semibold text-foreground w-10 text-center tabular-nums">
                {numQuestions}
              </span>
              <button
                onClick={() => setNumQuestions((n) => n + 1)}
                className="w-10 h-10 rounded-xl border bg-secondary border-border text-foreground text-lg font-bold flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm text-muted-foreground">Topic (optional)</label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
            >
              <option value="">All topics</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {(t as any).name || t.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-muted-foreground">
              Difficulty (optional)
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty((e.target.value as any) || '')}
              className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
            >
              <option value="">All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 items-center mt-4">
          <button
            onClick={startTest}
            disabled={!canStart || loading}
            className={`px-4 py-2 rounded-lg ${canStart ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} disabled:opacity-50`}
          >
            {loading ? 'Loading...' : 'Start Test'}
          </button>
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      </div>

      {!!questions.length && (
        <div className="p-4 rounded-2xl border bg-card border-border/50">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <div className="flex gap-2 items-center">
              <div className="w-24 h-2 rounded bg-muted">
                <div className="h-2 rounded bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg border bg-input border-border">
              <RichText
                data={current.question}
                className="text-sm text-foreground"
                enableProse={false}
                enableGutter={false}
              />
            </div>
            <div className="space-y-2">
              {current.options.map((opt) => {
                const selectedOptionId = selections[current.id]
                const isActive = selectedOptionId === opt.id
                return (
                  <button
                    key={opt.id || opt.text}
                    onClick={() => selectAnswer(current.id, opt.id)}
                    disabled={submitted}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border'}`}
                  >
                    {opt.text}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                className="px-3 py-2 rounded-lg border bg-secondary text-foreground border-border disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={nextQuestion}
                disabled={currentIndex === questions.length - 1}
                className="px-3 py-2 rounded-lg border bg-secondary text-foreground border-border disabled:opacity-50"
              >
                Next
              </button>
              <button
                onClick={submitTest}
                disabled={submitted || saving}
                className="px-3 py-2 ml-auto rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="flex fixed inset-0 z-50 justify-center items-end sm:items-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(false)} />
          <div className="relative p-4 m-0 w-full rounded-2xl border sm:max-w-md sm:m-4 bg-card border-border">
            <p className="mb-3 font-medium text-foreground">Submit answers?</p>
            <p className="mb-4 text-sm text-muted-foreground">
              The server will grade this attempt and show the correct answers after submitting.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowConfirm(false)
                  finalizeSubmit()
                }}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-2 rounded-lg border bg-secondary text-foreground border-border"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {submitted && result && (
        <div className="p-4 space-y-3 rounded-2xl border bg-card border-border/50">
          <p className="font-medium text-foreground">Results</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg border bg-input border-border">
              <p className="text-sm">Score</p>
              <p className="text-2xl font-bold">{result.scorePercentage}%</p>
            </div>
            <div className="p-3 rounded-lg border bg-input border-border">
              <p className="text-sm">Time</p>
              <p className="text-2xl font-bold">
                {result.timeUsed} min
              </p>
            </div>
            {averageScore !== null && (
              <div className="col-span-2 p-3 rounded-lg border bg-input border-border">
                <p className="text-sm">Average score (subject & level)</p>
                <p className="text-lg font-medium">{averageScore}%</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {questions.map((q) => {
              const gradedQuestion = result.questions.find((item) => item.questionId === q.id)
              if (!gradedQuestion) return null
              return (
                <div key={q.id} className="p-3 rounded-lg border bg-input border-border">
                  <RichText
                    data={q.question}
                    className="mb-2 text-sm font-medium"
                    enableProse={false}
                    enableGutter={false}
                  />
                  <p
                    className={`text-sm ${gradedQuestion.isCorrect ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}
                  >
                    Your answer: {gradedQuestion.selectedAnswer}
                  </p>
                  <p className="text-sm">Correct answer: {gradedQuestion.correctAnswer}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
