import { randomInt } from 'node:crypto'

import type { Mcq, TestResult } from '@/payload-types'

export const TEST_SESSION_TTL_MS = 2 * 60 * 60 * 1000
export const MAX_TEST_QUESTIONS = 50

export type PublicTestOption = {
  id: string
  text: string
}

export type PublicTestQuestion = {
  difficulty?: Mcq['difficulty']
  id: string
  options: PublicTestOption[]
  question: Mcq['question']
}

export type SubmittedAnswer = {
  questionId: string
  selectedOptionId: string | null
}

export type ScoredQuestion = {
  correctAnswer: string
  difficulty?: Mcq['difficulty']
  isCorrect: boolean
  question: string
  selectedAnswer: string
  timeSpent: number
}

export type ScoreSummary = {
  correctAnswers: number
  grade: TestResult['grade']
  incorrectAnswers: number
  questions: ScoredQuestion[]
  scorePercentage: number
  skippedQuestions: number
  strongAreas: Array<{ accuracy: number; topic: string }>
  totalQuestions: number
  weakAreas: Array<{ accuracy: number; topic: string }>
}

const relationshipID = (value: string | { id: string }): string =>
  typeof value === 'string' ? value : value.id

export const optionID = (questionId: string, option: { id?: string | null }, index: number): string =>
  option.id || `${questionId}:option:${index}`

export const hasOneCorrectOption = (question: Mcq): boolean =>
  question.options.filter((option) => option.isCorrect).length === 1

export const shuffle = <T>(
  values: T[],
  chooseIndex: (exclusiveMaximum: number) => number = randomInt,
): T[] => {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = chooseIndex(index + 1)
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

export const sanitizeQuestion = (question: Mcq): PublicTestQuestion => ({
  id: question.id,
  question: question.question,
  ...(question.difficulty ? { difficulty: question.difficulty } : {}),
  options: question.options.map((option, index) => ({
    id: optionID(question.id, option, index),
    text: option.text,
  })),
})

export const gradeForScore = (score: number): TestResult['grade'] => {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B+'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C+'
  if (score >= 40) return 'C'
  if (score >= 30) return 'D'
  return 'F'
}

export const scoreQuestions = (questions: Mcq[], answers: SubmittedAnswer[]): ScoreSummary => {
  const knownQuestionIDs = new Set(questions.map((question) => question.id))
  const answerMap = new Map<string, string | null>()

  for (const answer of answers) {
    if (!knownQuestionIDs.has(answer.questionId)) {
      throw new Error('Submission contains a question outside this test session')
    }
    if (answerMap.has(answer.questionId)) {
      throw new Error('Submission contains duplicate answers')
    }
    answerMap.set(answer.questionId, answer.selectedOptionId)
  }

  let correctAnswers = 0
  let incorrectAnswers = 0
  let skippedQuestions = 0
  const topicScores = new Map<string, { correct: number; total: number }>()

  const scoredQuestions = questions.map((question) => {
    if (!hasOneCorrectOption(question)) {
      throw new Error(`Question ${question.id} does not have exactly one correct option`)
    }

    const correctIndex = question.options.findIndex((option) => option.isCorrect)
    const correctOption = question.options[correctIndex]
    const selectedOptionID = answerMap.get(question.id) || null
    const selectedIndex = question.options.findIndex(
      (option, index) => optionID(question.id, option, index) === selectedOptionID,
    )
    const selectedOption = selectedIndex >= 0 ? question.options[selectedIndex] : null
    const isCorrect = Boolean(selectedOption && selectedIndex === correctIndex)

    if (!selectedOptionID) skippedQuestions += 1
    else if (!selectedOption) throw new Error('Submission contains an invalid option')
    else if (isCorrect) correctAnswers += 1
    else incorrectAnswers += 1

    for (const topic of question.topic ?? []) {
      const topicId = relationshipID(topic as string | { id: string })
      const current = topicScores.get(topicId) ?? { correct: 0, total: 0 }
      current.total += 1
      if (isCorrect) current.correct += 1
      topicScores.set(topicId, current)
    }

    return {
      question: question.id,
      selectedAnswer: selectedOption?.text ?? 'SKIPPED',
      correctAnswer: correctOption.text,
      isCorrect,
      timeSpent: 0,
      ...(question.difficulty ? { difficulty: question.difficulty } : {}),
    }
  })

  const totalQuestions = questions.length
  const scorePercentage = totalQuestions
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0
  const topicAreas = [...topicScores.entries()].map(([topic, value]) => ({
    topic,
    accuracy: Math.round((value.correct / value.total) * 100),
  }))

  return {
    correctAnswers,
    grade: gradeForScore(scorePercentage),
    incorrectAnswers,
    questions: scoredQuestions,
    scorePercentage,
    skippedQuestions,
    strongAreas: topicAreas.filter((area) => area.accuracy >= 80),
    totalQuestions,
    weakAreas: topicAreas.filter((area) => area.accuracy < 60),
  }
}
