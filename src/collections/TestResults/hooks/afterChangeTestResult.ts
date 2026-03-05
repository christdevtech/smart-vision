import { CollectionAfterChangeHook } from 'payload'

export const afterChangeTestResult: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  // Only trigger on create (a new submitted test result)
  if (operation !== 'create') return doc

  const userId = typeof doc.user === 'string' ? doc.user : doc.user?.id
  if (!userId) return doc

  const score = doc.scorePercentage ?? 0
  const subjectName =
    typeof doc.subject === 'string'
      ? 'your subject'
      : ((doc.subject as any)?.name ?? 'your subject')
  const testTypeLabel =
    doc.testType === 'practice'
      ? 'Practice Test'
      : doc.testType === 'timed'
        ? 'Timed Test'
        : doc.testType === 'exam_paper'
          ? 'Exam Paper'
          : 'Test'

  try {
    // Score notification
    const gradeEmoji = score >= 80 ? '🌟' : score >= 60 ? '👍' : score >= 40 ? '📖' : '💪'

    await req.payload.create({
      collection: 'notifications',
      data: {
        title: `${gradeEmoji} ${testTypeLabel} Result — ${score}%`,
        message: `You scored ${score}% on your ${subjectName} ${testTypeLabel.toLowerCase()}. ${
          score >= 80
            ? 'Excellent work!'
            : score >= 60
              ? 'Good job! Keep practising.'
              : 'Review the topics you found difficult and try again.'
        }`,
        recipient: userId,
        type: 'test_result',
        priority: 'normal',
        isRead: false,
        isActive: true,
        actionLink: `/dashboard/testing/results/${doc.id}`,
        actionLabel: 'View Results',
        pushNotification: { sendPush: false },
        metadata: {
          source: 'automated',
          relatedContentType: 'test-results',
          relatedContentId: doc.id,
          tags: [{ tag: 'test' }, { tag: 'result' }],
        },
      },
    })

    // Achievement notification for high scores
    if (score >= 80) {
      await req.payload.create({
        collection: 'notifications',
        data: {
          title: '🏆 Achievement Unlocked!',
          message: `Amazing! You scored ${score}% on your ${subjectName} test. You're on a roll — keep going!`,
          recipient: userId,
          type: 'achievement',
          priority: 'normal',
          isRead: false,
          isActive: true,
          actionLink: '/dashboard/progress',
          actionLabel: 'View Progress',
          pushNotification: { sendPush: false },
          metadata: {
            source: 'automated',
            tags: [{ tag: 'achievement' }, { tag: 'high-score' }],
          },
        },
      })
    }
  } catch (error) {
    console.error('Error creating test result notification:', error)
  }

  return doc
}
