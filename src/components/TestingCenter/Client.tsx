'use client'

import React from 'react'
import { FileText } from 'lucide-react'
import { AcademicLevel, Subject, Topic, ExamPaper, TestResult, Mcq, User } from '@/payload-types'
import RichText from '../RichText'

function getId(val: string | { id: string } | undefined | null) {
  if (!val) return ''
  if (typeof val === 'string') return val
  return (val as any).id || ''
}

function computeGrade(score: number): TestResult['grade'] {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B+'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C+'
  if (score >= 40) return 'C'
  if (score >= 30) return 'D'
  return 'F'
}

export default function TestingCenterClient({
  user,
  subscriptionActive,
  academicLevels,
  subjects,
  topics,
}: {
  user: User
  subscriptionActive: boolean
  academicLevels: AcademicLevel[]
  subjects: Subject[]
  topics: Topic[]
}) {
  const [mode, setMode] = React.useState<'practice' | 'exam_paper'>('practice')
  const [academicLevelId, setAcademicLevelId] = React.useState<string>(
    () => getId(user.academicLevel) || '',
  )
  const [subjectId, setSubjectId] = React.useState<string>('')
  const [topicId, setTopicId] = React.useState<string>('')
  const [difficulty, setDifficulty] = React.useState<'easy' | 'medium' | 'hard' | ''>('')
  const [availableTopics, setAvailableTopics] = React.useState<Topic[]>([])
  const [examPaper, setExamPaper] = React.useState<ExamPaper | null>(null)
  const [examPapers, setExamPapers] = React.useState<ExamPaper[]>([])
  const [selectedPaperId, setSelectedPaperId] = React.useState<string>('')
  const [numQuestions, setNumQuestions] = React.useState<number>(20)
  const [showConfirm, setShowConfirm] = React.useState(false)

  const [questions, setQuestions] = React.useState<Mcq[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [selections, setSelections] = React.useState<Record<string, string>>({})
  const [questionTimes, setQuestionTimes] = React.useState<Record<string, number>>({})
  const [startedAt, setStartedAt] = React.useState<number | null>(null)
  const [lastTick, setLastTick] = React.useState<number | null>(null)
  const [submitted, setSubmitted] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [averageScore, setAverageScore] = React.useState<number | null>(null)

  React.useEffect(() => {
    const t = topics.filter((t) => (t.subjects || []).some((s) => getId(s) === subjectId))
    setAvailableTopics(t)
    if (topicId && !t.find((x) => x.id === topicId)) {
      setTopicId('')
    }
  }, [subjectId, topics])

  React.useEffect(() => {
    async function fetchExamPapers() {
      if (mode !== 'exam_paper') return
      if (!academicLevelId || !subjectId) {
        setExamPapers([])
        setSelectedPaperId('')
        return
      }
      try {
        const res = await fetch(
          `/api/exam-papers?limit=50&where[academicLevel][equals]=${encodeURIComponent(academicLevelId)}&where[subject][equals]=${encodeURIComponent(subjectId)}`,
        )
        const data = await res.json()
        const docs: ExamPaper[] = data?.docs || []
        setExamPapers(docs)
        if (!docs.find((p) => p.id === selectedPaperId)) {
          setSelectedPaperId('')
        }
      } catch {
        setExamPapers([])
        setSelectedPaperId('')
      }
    }
    fetchExamPapers()
  }, [mode, academicLevelId, subjectId])

  React.useEffect(() => {
    const key = 'testing-config'
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null')
      if (saved && saved.userId === user.id) {
        setMode(saved.mode || 'practice')
        setAcademicLevelId(saved.academicLevelId || academicLevelId)
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
      mode,
      academicLevelId,
      subjectId,
      topicId,
      difficulty,
      numQuestions,
    }
    try {
      localStorage.setItem(key, JSON.stringify(payload))
    } catch {}
  }, [user.id, mode, academicLevelId, subjectId, topicId, difficulty, numQuestions])

  React.useEffect(() => {
    let timer: any
    if (startedAt !== null && questions[currentIndex]) {
      const now = Date.now()
      setLastTick(now)
      timer = setInterval(() => {
        setQuestionTimes((prev) => {
          const qid = questions[currentIndex].id
          const dt = 1
          const next = { ...prev, [qid]: (prev[qid] || 0) + dt }
          return next
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [startedAt, currentIndex, questions])

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
    setSelections({})
    setQuestionTimes({})
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
    if (mode === 'exam_paper' && !selectedPaperId) {
      setError('Select an exam paper to start.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'exam_paper') {
        const epRes = await fetch(`/api/exam-papers/${encodeURIComponent(selectedPaperId)}`)
        const epData = await epRes.json()
        const ep: ExamPaper | null = epData || null
        setExamPaper(ep)
      } else {
        setExamPaper(null)
      }

      const qs: string[] = []
      qs.push(`where[and][0][subject][equals]=${encodeURIComponent(subjectId)}`)
      qs.push(`where[and][1][academicLevel][equals]=${encodeURIComponent(academicLevelId)}`)
      if (mode !== 'exam_paper' && difficulty)
        qs.push(`where[and][2][difficulty][equals]=${encodeURIComponent(difficulty)}`)
      const url = `/api/mcq?limit=100&${qs.join('&')}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load questions')
      const data = await res.json()
      let docs: Mcq[] = data?.docs || []
      if (topicId) {
        docs = docs.filter((q) => (q.topic || []).some((t) => getId(t) === topicId))
      }
      const wanted = Math.max(1, Math.min(numQuestions || 20, docs.length))
      const shuffled = [...docs].sort(() => Math.random() - 0.5)
      setQuestions(shuffled.slice(0, wanted))
      setStartedAt(Date.now())
      await fetchAverageScore(subjectId, academicLevelId)
    } catch (e: any) {
      setError(e?.message || 'Failed to start test')
    } finally {
      setLoading(false)
    }
  }

  function selectAnswer(qid: string, text: string) {
    setSelections((prev) => ({ ...prev, [qid]: text }))
  }

  function nextQuestion() {
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))
  }
  function prevQuestion() {
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }

  async function finalizeSubmit() {
    if (!questions.length) return
    setSubmitted(true)
    setSaving(true)
    try {
      const totalQuestions = questions.length
      let correctAnswers = 0
      let incorrectAnswers = 0
      let skipped = 0

      const perTopic: Record<string, { correct: number; total: number }> = {}

      const items = questions.map((q) => {
        const correctOpt = q.options.find((o) => o.isCorrect)
        const selectedText = selections[q.id]
        const correctText = correctOpt?.text || ''
        const isCorrect = !!selectedText && selectedText === correctText
        if (!selectedText) skipped++
        else if (isCorrect) correctAnswers++
        else incorrectAnswers++
        ;(q.topic || []).forEach((t) => {
          const tid = getId(t)
          if (!tid) return
          if (!perTopic[tid]) perTopic[tid] = { correct: 0, total: 0 }
          perTopic[tid].total += 1
          if (isCorrect) perTopic[tid].correct += 1
        })

        return {
          question: q.id,
          selectedAnswer: selectedText || 'SKIPPED',
          correctAnswer: correctText,
          isCorrect,
          timeSpent: questionTimes[q.id] || 0,
          ...(q.difficulty ? { difficulty: q.difficulty } : {}),
        }
      })

      const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100)
      const timeUsedMinutes = startedAt ? Math.round((Date.now() - startedAt) / 60000) : 0
      const grade = computeGrade(scorePercentage)

      const weakAreas = Object.entries(perTopic)
        .map(([tid, v]) => ({ topic: tid, accuracy: Math.round((v.correct / v.total) * 100) }))
        .filter((x) => (x.accuracy || 0) < 60)
      const strongAreas = Object.entries(perTopic)
        .map(([tid, v]) => ({ topic: tid, accuracy: Math.round((v.correct / v.total) * 100) }))
        .filter((x) => (x.accuracy || 0) >= 80)

      const body: Partial<TestResult> = {
        user: user.id,
        testType: mode === 'exam_paper' ? 'exam_paper' : 'practice',
        subject: subjectId,
        topics: topicId ? [topicId] : [],
        academicLevel: academicLevelId,
        examPaper: examPaper ? examPaper.id : undefined,
        questions: items as any,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        skippedQuestions: skipped,
        scorePercentage,
        grade,
        timeLimit: examPaper?.duration || null,
        timeUsed: timeUsedMinutes,
        startedAt: new Date(startedAt || Date.now()).toISOString(),
        completedAt: new Date().toISOString(),
        isCompleted: true,
        weakAreas: weakAreas as any,
        strongAreas: strongAreas as any,
        reviewMode: false,
      }

      const res = await fetch('/api/test-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        let msg = 'Failed to save results'
        try {
          const err = await res.json()
          msg = err?.message || err?.error || msg
        } catch {}
        throw new Error(msg)
      }
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
            <p className="font-medium text-foreground">Test Configuration</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('practice')}
              className={`px-3 py-2 rounded-lg border ${mode === 'practice' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border'}`}
            >
              Practice
            </button>
            <button
              onClick={() => setMode('exam_paper')}
              className={`px-3 py-2 rounded-lg border ${mode === 'exam_paper' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border'}`}
            >
              Exam Paper
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm text-muted-foreground">Academic Level</label>
            <select
              value={academicLevelId}
              onChange={(e) => setAcademicLevelId(e.target.value)}
              className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
            >
              <option value="">Select level</option>
              {academicLevels.map((l) => (
                <option key={l.id} value={l.id}>
                  {(l as any).name || l.id}
                </option>
              ))}
            </select>
          </div>
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
          <div>
            <label className="block mb-1 text-sm text-muted-foreground">Number of Questions</label>
            <input
              type="number"
              min={1}
              value={numQuestions}
              onChange={(e) => {
                const v = parseInt(e.target.value || '0', 10)
                setNumQuestions(Number.isNaN(v) ? 20 : Math.max(1, v))
              }}
              className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
            />
          </div>
          {mode !== 'exam_paper' && (
            <>
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
            </>
          )}
          {mode === 'exam_paper' && (
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm text-muted-foreground">Exam Paper</label>
              <select
                value={selectedPaperId}
                onChange={(e) => setSelectedPaperId(e.target.value)}
                className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
              >
                <option value="">Select exam paper</option>
                {examPapers.map((p) => {
                  const paperLabel = `${(p as any).title || 'Exam Paper'}${(p as any).year ? ` (${(p as any).year})` : ''}${(p as any).paperType ? ` - Paper ${(p as any).paperType}` : ''}`
                  return (
                    <option key={p.id} value={p.id}>
                      {paperLabel}
                    </option>
                  )
                })}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center mt-4">
          <button
            onClick={startTest}
            disabled={!canStart || loading || (mode === 'exam_paper' && !selectedPaperId)}
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
                const selectedText = selections[current.id]
                const isActive = selectedText === opt.text
                return (
                  <button
                    key={opt.id || opt.text}
                    onClick={() => selectAnswer(current.id, opt.text)}
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
              You will see explanations after submitting.
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

      {submitted && (
        <div className="p-4 space-y-3 rounded-2xl border bg-card border-border/50">
          <p className="font-medium text-foreground">Results</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg border bg-input border-border">
              <p className="text-sm">Score</p>
              <p className="text-2xl font-bold">
                {Object.values(selections).filter(Boolean).length
                  ? Math.round(
                      (questions.filter(
                        (q) =>
                          selections[q.id] === (q.options.find((o) => o.isCorrect)?.text || ''),
                      ).length /
                        questions.length) *
                        100,
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-input border-border">
              <p className="text-sm">Time</p>
              <p className="text-2xl font-bold">
                {startedAt ? Math.round((Date.now() - startedAt) / 60000) : 0} min
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
              const selectedText = selections[q.id]
              const correctText = q.options.find((o) => o.isCorrect)?.text || ''
              const correct = selectedText === correctText
              return (
                <div key={q.id} className="p-3 rounded-lg border bg-input border-border">
                  <RichText
                    data={q.question}
                    className="mb-2 text-sm font-medium"
                    enableProse={false}
                    enableGutter={false}
                  />
                  <p
                    className={`text-sm ${correct ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}
                  >
                    Your answer: {selectedText || '—'}
                  </p>
                  <p className="text-sm">Correct answer: {correctText}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
