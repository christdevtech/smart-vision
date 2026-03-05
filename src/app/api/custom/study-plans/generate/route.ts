import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { GoogleGenerativeAI } from '@google/generative-ai'
import config from '@/payload.config'

const SYSTEM_PROMPT = `You are an expert AI study planner for Smart Vision, an educational platform for Cameroonian students (GCE O Level, A Level, etc.).

Your job is to have a focused conversation with the student to understand:
1. Their subjects to study (use only IDs from the context provided)
2. Their available days and times each week
3. Their daily session duration preference
4. Their target exam date or timeline
5. Their study goals
6. Their preferred study style (practice questions, reading, videos, etc.)

Rules:
- Ask ONLY ONE or TWO clarifying questions at a time. Be friendly and encouraging.
- Once you have sufficient information (subjects + available times + a goal), generate the plan.
- When generating, output a structured JSON plan inside a markdown code block tagged \`\`\`json ... \`\`\` with EXACTLY this shape (field names must match precisely):

{
  "goals": "string — one-sentence summary",
  "planType": "regular_study" | "exam_prep" | "revision" | "catch_up" | "advanced",
  "targetExamDate": "ISO date string or null",
  "studyGoals": [
    {
      "title": "string",
      "description": "string or null",
      "targetDate": "ISO date or null",
      "priority": "high" | "medium" | "low",
      "status": "not_started"
    }
  ],
  "weeklySchedule": [
    {
      "dayOfWeek": "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "subject": "<subjectId from context — use the exact id string>",
      "sessionType": "study" | "practice" | "revision" | "test",
      "isActive": true
    }
  ],
  "milestones": [
    {
      "title": "string",
      "description": "string or null",
      "targetDate": "ISO date string"
    }
  ],
  "studyPreferences": {
    "preferredStudyTime": "morning" | "afternoon" | "evening" | "night" | "early_morning" | "late_night",
    "sessionDuration": <minutes as number>,
    "breakDuration": <minutes as number>,
    "studyMethod": ["reading", "video", "practice", "notes", "flashcards"],
    "difficultyPreference": "easy_first" | "hard_first" | "mixed"
  },
  "studyReminders": [
    {
      "title": "string — short reminder title",
      "message": "string — reminder message text",
      "reminderTime": "HH:MM",
      "reminderType": "study_session",
      "isRecurring": true,
      "recurrencePattern": "weekly",
      "isActive": true
    }
  ]
}

IMPORTANT: Only use subject IDs provided in the context. Never invent subject IDs.
After the JSON block, add a short friendly summary of what you created.
ONLY output the JSON block when you have enough information to build a complete, realistic plan.`

export async function POST(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add GEMINI_API_KEY to your environment.' },
        { status: 503 },
      )
    }

    const body = await request.json()
    const { messages = [], context = {} } = body as {
      messages: { role: 'user' | 'model'; parts: [{ text: string }] }[]
      context: {
        subjects?: { id: string; name: string }[]
        academicLevels?: { id: string; name: string }[]
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Build context string for the system prompt
    const subjectContext = context.subjects?.length
      ? `Available subjects (use these IDs exactly): ${context.subjects.map((s) => `${s.name} (id: ${s.id})`).join(', ')}`
      : ''
    const levelContext = context.academicLevels?.length
      ? `Academic levels: ${context.academicLevels.map((l) => l.name).join(', ')}`
      : ''

    const fullSystemPrompt = [SYSTEM_PROMPT, subjectContext, levelContext]
      .filter(Boolean)
      .join('\n\n')

    const chat = model.startChat({
      history: messages.slice(0, -1), // all except last (that's sent as the user turn)
      systemInstruction: { role: 'system', parts: [{ text: fullSystemPrompt }] },
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage?.parts?.[0]?.text ?? '')
    const replyText = result.response.text()

    // Try to extract a JSON plan from the response
    const jsonMatch = replyText.match(/```json\s*([\s\S]*?)```/)
    let plan: object | null = null
    if (jsonMatch?.[1]) {
      try {
        plan = JSON.parse(jsonMatch[1].trim())
      } catch {
        // Not valid JSON yet, keep going
      }
    }

    return NextResponse.json({ reply: replyText, plan }, { status: 200 })
  } catch (error) {
    console.error('Study plan generation error:', error)
    return NextResponse.json({ error: 'Failed to generate study plan' }, { status: 500 })
  }
}
