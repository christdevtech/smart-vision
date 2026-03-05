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
  // If the user has no plan yet, start in chat mode to create one
  const [mode, setMode] = useState<'dashboard' | 'chat'>(
    initialPlan?.isActive ? 'dashboard' : 'chat',
  )
  // Track the plan locally so we can refresh after the AI saves a new one
  const [plan, setPlan] = useState<StudyPlan | null>(initialPlan)

  function handlePlanSaved(updatedPlan?: StudyPlan) {
    if (updatedPlan) setPlan(updatedPlan)
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
          onPlanSaved={handlePlanSaved}
        />
      </div>
    )
  }

  if (!plan) {
    // Shouldn't hit this, but guard anyway
    setMode('chat')
    return null
  }

  return <PlanDashboard plan={plan} subjects={subjects} onAdjust={() => setMode('chat')} />
}
