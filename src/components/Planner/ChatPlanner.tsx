'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Bot, User, AlertCircle, ChevronRight } from 'lucide-react'
import type { AcademicLevel, Subject, Topic, StudyPlan } from '@/payload-types'
// GeneratedPlan is derived from StudyPlan in payload-types — single source of truth
import PlanPreviewCard, { type GeneratedPlan } from './PlanPreviewCard'

type GeminiRole = 'user' | 'model'

interface GeminiMessage {
  role: GeminiRole
  parts: [{ text: string }]
}

interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  plan?: GeneratedPlan | null
  isError?: boolean
}

interface ChatPlannerProps {
  userId: string
  academicLevels: AcademicLevel[]
  subjects: Subject[]
  topics: Topic[]
  initialPlan?: StudyPlan | null
}

const QUICK_PROMPTS = [
  "I want to prepare for my GCE O Level exams. I'm free weekdays 6pm–8pm.",
  'Help me create an A Level revision plan. Exams in 3 months, available daily from 4pm.',
  'I need to catch up on Maths and Physics — can study 2 hours every day.',
  'Build a study plan for all my subjects across Mon, Wed, Fri evenings.',
]

function stripJsonBlock(text: string): string {
  return text.replace(/```json[\s\S]*?```/g, '').trim()
}

export default function ChatPlanner({
  userId,
  academicLevels,
  subjects,
  topics,
  initialPlan,
}: ChatPlannerProps) {
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([])
  const [chatHistory, setChatHistory] = useState<GeminiMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Build a quick lookup: subject ID → display name
  const subjectMap: Record<string, string> = {}
  for (const s of subjects) {
    subjectMap[s.id as string] = s.name ?? (s.id as string)
  }

  // Greeting on mount
  useEffect(() => {
    const hasPlan = initialPlan?.isActive
    if (hasPlan) {
      const count = initialPlan?.weeklySchedule?.length ?? 0
      const days = new Set((initialPlan?.weeklySchedule ?? []).map((s) => s.dayOfWeek)).size
      pushAssistant(
        `👋 Welcome back! You have an active study plan with **${count} sessions across ${days} days per week**.\n\nWould you like to **refine your current plan**, or start fresh? Just describe what you'd like to change.`,
      )
    } else {
      pushAssistant(
        "👋 Hi! I'm your AI study planner. I'll create a personalised study schedule just for you.\n\n**To get started, tell me:**\n- Which subjects do you want to study?\n- When are you available? (days and times)\n- How long can you study per session?\n- Do you have a target exam date?\n\nYou can answer all at once or one at a time.",
      )
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages, loading])

  function pushAssistant(text: string, plan?: GeneratedPlan | null) {
    setDisplayMessages((prev) => [
      ...prev,
      { id: `a-${Date.now()}-${prev.length}`, role: 'assistant', text, plan },
    ])
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userText = text.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // Add user message to display
    setDisplayMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}-${prev.length}`, role: 'user', text: userText },
    ])

    const newEntry: GeminiMessage = { role: 'user', parts: [{ text: userText }] }
    const updatedHistory = [...chatHistory, newEntry]

    setLoading(true)
    try {
      const resp = await fetch('/api/custom/study-plans/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          context: {
            subjects: subjects.map((s) => ({ id: s.id, name: s.name })),
            academicLevels: academicLevels.map((l) => ({ id: l.id, name: l.name })),
          },
        }),
      })

      const data = await resp.json()

      if (!resp.ok) {
        setDisplayMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            text: data.error ?? 'Something went wrong. Please try again.',
            isError: true,
          },
        ])
        return
      }

      const replyText: string = data.reply ?? ''
      const extractedPlan: GeneratedPlan | null = data.plan ?? null

      const assistantEntry: GeminiMessage = { role: 'model', parts: [{ text: replyText }] }
      setChatHistory([...updatedHistory, assistantEntry])

      const visibleText = extractedPlan ? stripJsonBlock(replyText) : replyText
      pushAssistant(visibleText, extractedPlan)
    } catch {
      setDisplayMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Failed to reach the AI. Please check your connection and try again.',
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function applyPlan(plan: GeneratedPlan) {
    setSaving(true)
    try {
      // The upsert route's sanitizeStudyPlan() handles all field validation and
      // normalisation. We only inject academicLevel here since the AI doesn't know it.
      const academicLevelId =
        (typeof initialPlan?.academicLevel === 'string'
          ? initialPlan.academicLevel
          : (initialPlan?.academicLevel as any)?.id) ??
        academicLevels[0]?.id ??
        null

      const resp = await fetch('/api/custom/study-plans/upsert', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plan, academicLevel: academicLevelId }),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        pushAssistant(
          `⚠️ Failed to save the plan: ${err.error ?? 'Unknown error'}. Please try again.`,
        )
        return
      }

      setSavedOk(true)
      pushAssistant(
        '✅ Your study plan has been saved! You can start following it right away. Would you like any adjustments?',
      )
    } catch {
      pushAssistant('⚠️ An error occurred while saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleRegenerate() {
    sendMessage(
      'Please regenerate the study plan with slightly different session timings or distribution.',
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  function renderText(text: string) {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <p key={i} className={line === '' ? 'h-2' : ''}>
          {parts.map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
        </p>
      )
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-260px)] min-h-[500px] rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/95">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Study Planner</p>
          <p className="text-xs text-muted-foreground">Powered by Google Gemini</p>
        </div>
        {savedOk && (
          <span className="ml-auto text-xs text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
            Plan saved ✓
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {displayMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-primary/10'
                    : msg.isError
                      ? 'bg-destructive/10'
                      : 'bg-gradient-to-br from-primary to-secondary'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-3.5 h-3.5 text-primary" />
                ) : msg.isError ? (
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-white" />
                )}
              </div>

              <div
                className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed space-y-1 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : msg.isError
                        ? 'bg-destructive/10 text-destructive rounded-tl-sm border border-destructive/20'
                        : 'bg-input text-foreground rounded-tl-sm border border-border/50'
                  }`}
                >
                  {renderText(msg.text)}
                </div>

                {msg.plan && (
                  <div className="w-full max-w-md">
                    <PlanPreviewCard
                      plan={msg.plan}
                      subjectMap={subjectMap}
                      onApply={() => applyPlan(msg.plan!)}
                      onRegenerate={handleRegenerate}
                      saving={saving}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing animation */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 items-start"
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm bg-input border border-border/50">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts — only on first message */}
      {displayMessages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => sendMessage(prompt)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border bg-input hover:bg-accent hover:border-primary/30 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              {prompt.slice(0, 55)}…
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card/95">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe your goals, available times, subjects… (Enter to send)"
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-xl border bg-input border-border text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 min-h-[40px] max-h-[120px]"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground text-center">
          Shift+Enter for new line • Enter to send
        </p>
      </div>
    </div>
  )
}
