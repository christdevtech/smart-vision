'use client'

import React, { useState } from 'react'
import type { AcademicLevel, Subject, Topic, StudyPlan } from '@/payload-types'
import PlanDashboard from '@/components/Planner/PlanDashboard'
import ChatPlanner from '@/components/Planner/ChatPlanner'

interface PlannerClientProps {
  userId: string
  academicLevels: AcademicLevel[]
  subjects: Subject[]
  topics: Topic[]
  initialPlan: StudyPlan | null
}

export default function PlannerClient({
  userId,
  academicLevels,
  subjects,
  topics,
  initialPlan,
}: PlannerClientProps) {
  const [mode, setMode] = useState<'dashboard' | 'chat'>(
    initialPlan?.isActive ? 'dashboard' : 'chat',
  )
  const [plan, setPlan] = useState<StudyPlan | null>(initialPlan)
  const [chatPrefill, setChatPrefill] = useState<string | undefined>(undefined)

  function handleAdjust(prefill?: string) {
    setChatPrefill(prefill)
    setMode('chat')
  }

  function handlePlanSaved(savedPlan?: StudyPlan) {
    if (savedPlan) setPlan(savedPlan)
    setChatPrefill(undefined)
    setMode('dashboard')
  }

  if (mode === 'chat') {
    return (
      <div className="space-y-4">
        {plan && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Chat with the AI to adjust your plan</p>
            <button
              onClick={() => setMode('dashboard')}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              ← Back to my plan
            </button>
          </div>
        )}
        <ChatPlanner
          userId={userId}
          academicLevels={academicLevels}
          subjects={subjects}
          topics={topics}
          initialPlan={plan}
          initialMessage={chatPrefill}
          onPlanSaved={handlePlanSaved}
        />
      </div>
    )
  }

  if (!plan) {
    // No plan yet — render chat to create one
    return (
      <ChatPlanner
        userId={userId}
        academicLevels={academicLevels}
        subjects={subjects}
        topics={topics}
        initialPlan={null}
        onPlanSaved={handlePlanSaved}
      />
    )
  }

  return <PlanDashboard plan={plan} subjects={subjects} onAdjust={handleAdjust} />
}
