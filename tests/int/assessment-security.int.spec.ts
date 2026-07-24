import { MCQuestions } from '@/collections/MCQuestions'
import { TestResults } from '@/collections/TestResults'
import type { Mcq, TestResult, TestSession } from '@/payload-types'
import {
  parseStartTestInput,
  parseSubmitTestInput,
  submitPracticeTest,
} from '@/services/testSessionService'
import { sanitizeQuestion, scoreQuestions } from '@/services/testScoring'
import { describe, expect, it, vi } from 'vitest'

const question = {
  id: 'question-1',
  question: {
    root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 },
  },
  options: [
    { id: 'option-a', isCorrect: true, text: 'Correct' },
    { id: 'option-b', isCorrect: false, text: 'Incorrect' },
    { id: 'option-c', isCorrect: false, text: 'Another' },
  ],
  academicLevel: 'level-1',
  subject: 'subject-1',
  topic: ['topic-1'],
  difficulty: 'medium',
  updatedAt: '2026-07-22T00:00:00.000Z',
  createdAt: '2026-07-22T00:00:00.000Z',
} satisfies Mcq

const user = {
  id: 'user-1',
  role: 'user',
  academicLevel: 'level-1',
}

describe('assessment trust boundary', () => {
  it('removes correctness from questions returned to the browser', () => {
    const sanitized = sanitizeQuestion(question)

    expect(sanitized.options).toHaveLength(3)
    expect(sanitized.options.every((option) => !('isCorrect' in option))).toBe(true)
    expect(JSON.stringify(sanitized)).not.toContain('isCorrect')
  })

  it('scores option IDs on the server and rejects answers outside the session', () => {
    const score = scoreQuestions(
      [question],
      [{ questionId: question.id, selectedOptionId: 'option-b' }],
    )

    expect(score).toMatchObject({
      correctAnswers: 0,
      grade: 'F',
      incorrectAnswers: 1,
      scorePercentage: 0,
      skippedQuestions: 0,
      totalQuestions: 1,
    })
    expect(score.questions[0]).toMatchObject({
      correctAnswer: 'Correct',
      isCorrect: false,
      selectedAnswer: 'Incorrect',
    })
    expect(() =>
      scoreQuestions(
        [question],
        [{ questionId: 'question-outside-session', selectedOptionId: 'option-a' }],
      ),
    ).toThrow('outside this test session')
  })

  it('accepts only bounded configuration and answer identifiers', () => {
    expect(
      parseStartTestInput({
        subjectId: 'subject-1',
        numQuestions: 20,
        userId: 'attacker-selected-user',
        scorePercentage: 100,
      }),
    ).toEqual({ subjectId: 'subject-1', numQuestions: 20 })
    expect(() => parseStartTestInput({ subjectId: 'subject-1', numQuestions: 51 })).toThrow(
      'between 1 and 50',
    )
    expect(() =>
      parseSubmitTestInput({
        sessionId: 'session-1',
        answers: [{ questionId: question.id, selectedOptionId: { forged: true } }],
      }),
    ).toThrow('selectedOptionId is invalid')
  })

  it('derives immutable result metrics from the stored session and answer key', async () => {
    const now = new Date('2026-07-22T12:10:00.000Z')
    const session = {
      id: 'session-1',
      user: user.id,
      testType: 'practice',
      subject: 'subject-1',
      topics: ['topic-1'],
      academicLevel: 'level-1',
      questions: [question.id],
      status: 'active',
      startedAt: '2026-07-22T12:00:00.000Z',
      expiresAt: '2026-07-22T14:00:00.000Z',
      updatedAt: '2026-07-22T12:00:00.000Z',
      createdAt: '2026-07-22T12:00:00.000Z',
    } satisfies TestSession

    const payload = {
      findByID: vi.fn().mockResolvedValue(session),
      find: vi.fn().mockImplementation(({ collection }: { collection: string }) => {
        if (collection === 'test-results') return Promise.resolve({ docs: [] })
        if (collection === 'subscriptions') {
          return Promise.resolve({
            docs: [
              {
                plan: 'monthly',
                paymentStatus: 'paid',
                endDate: '2099-01-01T00:00:00.000Z',
              },
            ],
          })
        }
        if (collection === 'mcq') return Promise.resolve({ docs: [question] })
        throw new Error(`Unexpected collection ${collection}`)
      }),
      count: vi.fn().mockResolvedValue({ totalDocs: 2 }),
      create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          ...data,
          id: 'result-1',
          updatedAt: now.toISOString(),
          createdAt: now.toISOString(),
        } as TestResult),
      ),
      update: vi.fn().mockResolvedValue({}),
    }

    const result = await submitPracticeTest({
      input: {
        sessionId: session.id,
        answers: [{ questionId: question.id, selectedOptionId: 'option-b' }],
      },
      now,
      payload: payload as never,
      user: user as never,
    })

    expect(result).toMatchObject({
      correctAnswers: 0,
      incorrectAnswers: 1,
      scorePercentage: 0,
      timeUsed: 10,
      totalQuestions: 1,
    })
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'test-results',
        data: expect.objectContaining({
          attemptNumber: 3,
          correctAnswers: 0,
          scorePercentage: 0,
          session: session.id,
          user: user.id,
        }),
        overrideAccess: true,
      }),
    )
  })

  it('blocks ordinary result creation and all result updates', () => {
    const normalRequest = { req: { user } }
    const adminRequest = { req: { user: { id: 'admin-1', role: 'admin' } } }

    const createAccess = TestResults.access?.create as (args: unknown) => unknown
    const updateAccess = TestResults.access?.update as (args: unknown) => unknown

    expect(createAccess(normalRequest)).toBe(false)
    expect(createAccess(adminRequest)).toBe(true)
    expect(updateAccess(normalRequest)).toBe(false)
    expect(updateAccess(adminRequest)).toBe(false)
  })

  it('hides answer flags and explanations from ordinary MCQ reads', () => {
    const optionsField = MCQuestions.fields.find(
      (field) => 'name' in field && field.name === 'options',
    )
    const isCorrectField =
      optionsField && 'fields' in optionsField
        ? optionsField.fields.find((field) => 'name' in field && field.name === 'isCorrect')
        : null
    const explanationField = MCQuestions.fields.find(
      (field) => 'name' in field && field.name === 'explanation',
    )

    expect(
      isCorrectField && 'access' in isCorrectField
        ? isCorrectField.access?.read?.({ req: { user } } as never)
        : true,
    ).toBe(false)
    expect(
      explanationField && 'access' in explanationField
        ? explanationField.access?.read?.({ req: { user } } as never)
        : true,
    ).toBe(false)
  })

  it('rejects ambiguous or duplicate answer keys during authoring', () => {
    const optionsField = MCQuestions.fields.find(
      (field) => 'name' in field && field.name === 'options',
    ) as { validate?: (value: unknown) => string | true }

    expect(optionsField.validate?.(question.options)).toBe(true)
    expect(
      optionsField.validate?.(question.options.map((option) => ({ ...option, isCorrect: false }))),
    ).toBe('Exactly one option must be marked correct')
    expect(
      optionsField.validate?.([
        question.options[0],
        { ...question.options[1], text: 'Correct' },
        question.options[2],
      ]),
    ).toBe('Answer options must be unique')
  })
})
