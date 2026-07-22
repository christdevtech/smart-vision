import type {
  Mcq,
  Subject,
  Subscription,
  TestResult,
  TestSession,
  Topic,
  User,
} from '@/payload-types'
import { isSubscriptionActive } from '@/utilities/subscription'
import {
  hasOneCorrectOption,
  MAX_TEST_QUESTIONS,
  sanitizeQuestion,
  scoreQuestions,
  shuffle,
  TEST_SESSION_TTL_MS,
  type PublicTestQuestion,
  type SubmittedAnswer,
} from '@/services/testScoring'
import type { Payload, Where } from 'payload'

export class AssessmentError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'AssessmentError'
    this.status = status
  }
}

export type StartTestInput = {
  difficulty?: 'easy' | 'medium' | 'hard'
  numQuestions: number
  subjectId: string
  topicId?: string
}

export type SubmitTestInput = {
  answers: SubmittedAnswer[]
  sessionId: string
}

export type TestResultResponse = {
  completedAt: string
  correctAnswers: number
  grade: TestResult['grade']
  id: string
  incorrectAnswers: number
  questions: Array<{
    correctAnswer: string
    isCorrect: boolean
    questionId: string
    selectedAnswer: string
  }>
  scorePercentage: number
  skippedQuestions: number
  timeUsed: number
  totalQuestions: number
}

const readID = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.length < 1 || value.length > 100) {
    throw new AssessmentError(`${label} is invalid`)
  }
  return value
}

const relationshipID = (value: string | { id: string } | null | undefined): string | null => {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

export const parseStartTestInput = (value: unknown): StartTestInput => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AssessmentError('A test configuration is required')
  }

  const input = value as Record<string, unknown>
  const numQuestions = input.numQuestions
  if (
    typeof numQuestions !== 'number' ||
    !Number.isInteger(numQuestions) ||
    numQuestions < 1 ||
    numQuestions > MAX_TEST_QUESTIONS
  ) {
    throw new AssessmentError(`numQuestions must be between 1 and ${MAX_TEST_QUESTIONS}`)
  }

  const difficulty = input.difficulty
  if (
    difficulty !== undefined &&
    difficulty !== '' &&
    !['easy', 'medium', 'hard'].includes(String(difficulty))
  ) {
    throw new AssessmentError('difficulty is invalid')
  }

  return {
    numQuestions,
    subjectId: readID(input.subjectId, 'subjectId'),
    ...(input.topicId ? { topicId: readID(input.topicId, 'topicId') } : {}),
    ...(difficulty ? { difficulty: difficulty as StartTestInput['difficulty'] } : {}),
  }
}

export const parseSubmitTestInput = (value: unknown): SubmitTestInput => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AssessmentError('A test submission is required')
  }

  const input = value as Record<string, unknown>
  if (!Array.isArray(input.answers) || input.answers.length > MAX_TEST_QUESTIONS) {
    throw new AssessmentError(`answers must contain at most ${MAX_TEST_QUESTIONS} items`)
  }

  const answers = input.answers.map((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new AssessmentError('Each answer must be an object')
    }
    const answer = value as Record<string, unknown>
    const selectedOptionId = answer.selectedOptionId
    if (
      selectedOptionId !== null &&
      selectedOptionId !== undefined &&
      (typeof selectedOptionId !== 'string' || selectedOptionId.length > 200)
    ) {
      throw new AssessmentError('selectedOptionId is invalid')
    }

    return {
      questionId: readID(answer.questionId, 'questionId'),
      selectedOptionId: typeof selectedOptionId === 'string' ? selectedOptionId : null,
    }
  })

  return {
    answers,
    sessionId: readID(input.sessionId, 'sessionId'),
  }
}

const requireActiveSubscription = async (payload: Payload, user: User): Promise<void> => {
  const subscriptions = await payload.find({
    collection: 'subscriptions',
    limit: 1,
    overrideAccess: false,
    sort: '-createdAt',
    user,
    where: { user: { equals: user.id } },
  })
  const subscription = (subscriptions.docs[0] as Subscription | undefined) ?? null
  if (!isSubscriptionActive(subscription)) {
    throw new AssessmentError('An active subscription is required', 403)
  }
}

const validateTestScope = async (
  payload: Payload,
  academicLevelId: string,
  input: StartTestInput,
): Promise<void> => {
  let subject: Subject
  try {
    subject = (await payload.findByID({
      collection: 'subjects',
      depth: 0,
      id: input.subjectId,
      overrideAccess: true,
    })) as Subject
  } catch {
    throw new AssessmentError('Subject not found', 404)
  }

  const levelIDs = (subject.academicLevels ?? []).map((level) => relationshipID(level))
  if (!levelIDs.includes(academicLevelId)) {
    throw new AssessmentError('Subject is not available for your academic level', 403)
  }

  if (input.topicId) {
    let topic: Topic
    try {
      topic = (await payload.findByID({
        collection: 'topics',
        depth: 0,
        id: input.topicId,
        overrideAccess: true,
      })) as Topic
    } catch {
      throw new AssessmentError('Topic not found', 404)
    }

    const subjectIDs = (topic.subjects ?? []).map((topicSubject) => relationshipID(topicSubject))
    if (!subjectIDs.includes(input.subjectId)) {
      throw new AssessmentError('Topic does not belong to the selected subject', 400)
    }
  }
}

export const startPracticeTest = async ({
  input,
  now = new Date(),
  payload,
  user,
}: {
  input: StartTestInput
  now?: Date
  payload: Payload
  user: User
}): Promise<{
  expiresAt: string
  questions: PublicTestQuestion[]
  sessionId: string
  startedAt: string
}> => {
  const academicLevelId = relationshipID(user.academicLevel)
  if (!academicLevelId) {
    throw new AssessmentError('Complete your academic-level setup before starting a test', 403)
  }

  await requireActiveSubscription(payload, user)
  await validateTestScope(payload, academicLevelId, input)

  const conditions: Where[] = [
    { subject: { equals: input.subjectId } },
    { academicLevel: { equals: academicLevelId } },
  ]
  if (input.topicId) conditions.push({ topic: { contains: input.topicId } })
  if (input.difficulty) conditions.push({ difficulty: { equals: input.difficulty } })

  const questionResult = await payload.find({
    collection: 'mcq',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    where: { and: conditions },
  })
  const eligibleQuestions = (questionResult.docs as Mcq[]).filter(hasOneCorrectOption)
  const selectedQuestions = shuffle(eligibleQuestions).slice(0, input.numQuestions)
  if (selectedQuestions.length === 0) {
    throw new AssessmentError('No valid questions are available for this configuration', 422)
  }

  const startedAt = now.toISOString()
  const expiresAt = new Date(now.getTime() + TEST_SESSION_TTL_MS).toISOString()
  const session = (await payload.create({
    collection: 'test-sessions',
    data: {
      academicLevel: academicLevelId,
      ...(input.difficulty ? { difficulty: input.difficulty } : {}),
      expiresAt,
      questions: selectedQuestions.map((question) => question.id),
      startedAt,
      status: 'active',
      subject: input.subjectId,
      testType: 'practice',
      topics: input.topicId ? [input.topicId] : [],
      user: user.id,
    },
    overrideAccess: true,
  })) as TestSession

  return {
    expiresAt,
    questions: selectedQuestions.map(sanitizeQuestion),
    sessionId: session.id,
    startedAt,
  }
}

const resultResponse = (result: TestResult): TestResultResponse => ({
  completedAt: result.completedAt,
  correctAnswers: result.correctAnswers,
  grade: result.grade,
  id: result.id,
  incorrectAnswers: result.incorrectAnswers,
  questions: result.questions.map((question) => ({
    correctAnswer: question.correctAnswer,
    isCorrect: question.isCorrect,
    questionId: relationshipID(question.question) ?? '',
    selectedAnswer: question.selectedAnswer,
  })),
  scorePercentage: result.scorePercentage,
  skippedQuestions: result.skippedQuestions ?? 0,
  timeUsed: result.timeUsed,
  totalQuestions: result.totalQuestions,
})

const findResultForSession = async (
  payload: Payload,
  sessionId: string,
): Promise<TestResult | null> => {
  const existing = await payload.find({
    collection: 'test-results',
    limit: 1,
    overrideAccess: true,
    where: { session: { equals: sessionId } },
  })
  return (existing.docs[0] as TestResult | undefined) ?? null
}

export const submitPracticeTest = async ({
  input,
  now = new Date(),
  payload,
  user,
}: {
  input: SubmitTestInput
  now?: Date
  payload: Payload
  user: User
}): Promise<TestResultResponse> => {
  let session: TestSession
  try {
    session = (await payload.findByID({
      collection: 'test-sessions',
      depth: 0,
      id: input.sessionId,
      overrideAccess: false,
      user,
    })) as TestSession
  } catch {
    throw new AssessmentError('Test session not found', 404)
  }

  const existingResult = await findResultForSession(payload, session.id)
  if (existingResult) return resultResponse(existingResult)
  if (session.status !== 'active') {
    throw new AssessmentError('Test session is no longer active', 409)
  }
  if (new Date(session.expiresAt).getTime() <= now.getTime()) {
    await payload.update({
      collection: 'test-sessions',
      data: { status: 'expired' },
      id: session.id,
      overrideAccess: true,
    })
    throw new AssessmentError('Test session has expired', 410)
  }

  await requireActiveSubscription(payload, user)

  const questionIDs = session.questions.map((question) => relationshipID(question) ?? '')
  const questionResult = await payload.find({
    collection: 'mcq',
    depth: 0,
    limit: questionIDs.length,
    overrideAccess: true,
    where: { id: { in: questionIDs } },
  })
  const questionByID = new Map((questionResult.docs as Mcq[]).map((question) => [question.id, question]))
  const questions = questionIDs.map((id) => questionByID.get(id)).filter(Boolean) as Mcq[]
  if (questions.length !== questionIDs.length) {
    throw new AssessmentError('One or more test questions are no longer available', 409)
  }

  let score: ReturnType<typeof scoreQuestions>
  try {
    score = scoreQuestions(questions, input.answers)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Test submission is invalid'
    const status = message.includes('exactly one correct option') ? 409 : 400
    throw new AssessmentError(message, status)
  }
  const completedAt = now.toISOString()
  const elapsedMinutes = Math.max(
    0,
    Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 60_000),
  )
  const userId = relationshipID(session.user) ?? user.id
  const subjectId = relationshipID(session.subject)
  const academicLevelId = relationshipID(session.academicLevel)
  if (!subjectId || !academicLevelId || userId !== user.id) {
    throw new AssessmentError('Test session ownership is invalid', 403)
  }

  const attempts = await payload.count({
    collection: 'test-results',
    overrideAccess: true,
    where: {
      and: [
        { user: { equals: user.id } },
        { subject: { equals: subjectId } },
        { testType: { equals: 'practice' } },
      ],
    },
  })

  let result: TestResult
  try {
    result = (await payload.create({
      collection: 'test-results',
      data: {
        academicLevel: academicLevelId,
        attemptNumber: attempts.totalDocs + 1,
        completedAt,
        correctAnswers: score.correctAnswers,
        grade: score.grade,
        incorrectAnswers: score.incorrectAnswers,
        isCompleted: true,
        questions: score.questions,
        reviewMode: false,
        scorePercentage: score.scorePercentage,
        session: session.id,
        skippedQuestions: score.skippedQuestions,
        startedAt: session.startedAt,
        strongAreas: score.strongAreas,
        subject: subjectId,
        testType: 'practice',
        timeLimit: null,
        timeUsed: elapsedMinutes,
        topics: (session.topics ?? []).map((topic) => relationshipID(topic) ?? '').filter(Boolean),
        totalQuestions: score.totalQuestions,
        user: user.id,
        weakAreas: score.weakAreas,
      },
      overrideAccess: true,
    })) as TestResult
  } catch (error) {
    const concurrentResult = await findResultForSession(payload, session.id)
    if (concurrentResult) return resultResponse(concurrentResult)
    throw error
  }

  await payload.update({
    collection: 'test-sessions',
    data: { completedAt, result: result.id, status: 'completed' },
    id: session.id,
    overrideAccess: true,
  })

  return resultResponse(result)
}
