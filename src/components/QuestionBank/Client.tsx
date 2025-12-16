'use client'

import React from 'react'
import { AcademicLevel, Subject, Topic, Mcq } from '@/payload-types'

function getId(val: string | { id: string } | undefined | null) {
  if (!val) return ''
  if (typeof val === 'string') return val
  return (val as any).id || ''
}

function richTextToPlain(rt: any): string {
  try {
    const root = rt?.root
    if (!root || !Array.isArray(root.children)) return ''
    return root.children.map((child: any) => (typeof child.text === 'string' ? child.text : '')).join(' ').trim()
  } catch {
    return ''
  }
}

export default function QuestionBankClient({
  academicLevels,
  subjects,
  topics,
}: {
  academicLevels: AcademicLevel[]
  subjects: Subject[]
  topics: Topic[]
}) {
  const [academicLevelId, setAcademicLevelId] = React.useState<string>('')
  const [subjectId, setSubjectId] = React.useState<string>('')
  const [topicId, setTopicId] = React.useState<string>('')
  const [availableTopics, setAvailableTopics] = React.useState<Topic[]>([])
  const [questions, setQuestions] = React.useState<Mcq[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const t = topics.filter((t) => (t.subjects || []).some((s) => getId(s) === subjectId))
    setAvailableTopics(t)
    if (topicId && !t.find((x) => x.id === topicId)) {
      setTopicId('')
    }
  }, [subjectId, topics])

  async function loadQuestions() {
    setLoading(true)
    try {
      const qs: string[] = []
      if (subjectId) qs.push(`where[and][0][subject][equals]=${encodeURIComponent(subjectId)}`)
      if (academicLevelId) qs.push(`where[and][1][academicLevel][equals]=${encodeURIComponent(academicLevelId)}`)
      const url = `/api/mcq?limit=100&${qs.join('&')}`
      const res = await fetch(url)
      const data = await res.json()
      let docs: Mcq[] = data?.docs || []
      if (topicId) {
        docs = docs.filter((q) => (q.topic || []).some((t) => getId(t) === topicId))
      }
      setQuestions(docs)
    } catch {
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="block mb-1 text-sm text-muted-foreground">Academic Level</label>
          <select
            value={academicLevelId}
            onChange={(e) => setAcademicLevelId(e.target.value)}
            className="px-3 py-2 w-full rounded-lg border bg-input border-border text-foreground"
          >
            <option value="">All levels</option>
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
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {(s as any).name || s.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm text-muted-foreground">Topic</label>
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
      </div>
      <div className="flex gap-2 items-center">
        <button
          onClick={loadQuestions}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Questions'}
        </button>
      </div>
      <div className="space-y-2">
        {questions.map((q) => (
          <div key={q.id} className="p-3 rounded-lg border bg-input border-border">
            <p className="mb-2 text-sm font-medium">{richTextToPlain(q.question)}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {q.options.map((o) => (
                <div
                  key={o.id || o.text}
                  className={`px-3 py-2 rounded-lg border ${o.isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400' : 'bg-secondary text-foreground border-border'}`}
                >
                  {o.text}
                </div>
              ))}
            </div>
          </div>
        ))}
        {!questions.length && (
          <div className="p-3 rounded-lg border bg-input border-border">
            <p className="text-sm text-muted-foreground">No questions loaded. Choose filters and click Load.</p>
          </div>
        )}
      </div>
    </div>
  )
}

