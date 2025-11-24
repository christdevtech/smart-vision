import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

const allowedRoles = ['admin', 'super-admin', 'content-manager']

function isAuthorized(req: NextRequest, user: any): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  if (process.env.NODE_ENV !== 'production') return true
  if (user?.role && allowedRoles.includes(user.role)) return true
  return false
}

function lexicalText(text: string) {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
          textFormat: 0,
          textStyle: '',
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

function makeOptions(topicName: string, i: number) {
  const correctText = `A statement about ${topicName} that is correct`
  const distractors = [
    `A statement about ${topicName} that is partially true`,
    `A statement about ${topicName} that is false`,
    `A statement unrelated to ${topicName}`,
  ]
  const correctPosition = i % 4
  const texts = [...distractors]
  texts.splice(correctPosition, 0, correctText)
  return texts.map((t) => ({ text: t, isCorrect: t === correctText }))
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = request as any

    if (!isAuthorized(request, user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const url = new URL(request.url)
    const perTopic = Number(url.searchParams.get('perTopic') || '10')
    const levelHint = url.searchParams.get('level') || ''
    const dryRun = url.searchParams.get('dryRun') === 'true'

    const levelsRes = await payload.find({ collection: 'academicLevels', limit: 200 })
    let levelId: string | null = null
    if (levelHint) {
      const matchBySlug = levelsRes.docs.find((l: any) => l.slug === levelHint)
      const matchByName = levelsRes.docs.find(
        (l: any) => (l.name || '').toLowerCase() === levelHint.toLowerCase(),
      )
      levelId = (matchBySlug || matchByName)?.id || null
    }
    if (!levelId) {
      const ol = levelsRes.docs.find((l: any) => (l.name || '').toLowerCase().includes('ordinary'))
      levelId = (ol || levelsRes.docs[0])?.id || null
    }
    if (!levelId) {
      return NextResponse.json({ error: 'No academic levels found' }, { status: 400 })
    }

    const subjectsRes = await payload.find({ collection: 'subjects', limit: 500 })
    const topicsRes = await payload.find({ collection: 'topics', limit: 1000 })

    const subjectIds = new Set<string>(subjectsRes.docs.map((s: any) => s.id))

    let created = 0
    const perTopicSummary: Record<string, { before: number; after: number; created: number }> = {}

    for (const topic of topicsRes.docs as any[]) {
      const topicId = topic.id as string
      const topicName = topic.name as string
      const topicSubjects = (topic.subjects || [])
        .map((s: any) => (typeof s === 'string' ? s : s.id))
        .filter((id: string) => subjectIds.has(id))
      for (const subjectId of topicSubjects) {
        const existingCountRes = await payload.find({
          collection: 'mcq',
          where: {
            and: [
              { subject: { equals: subjectId } },
              { academicLevel: { equals: levelId } },
              { topic: { contains: topicId } },
            ],
          },
          limit: 0,
        })
        const before = existingCountRes.totalDocs || 0
        const needed = Math.max(0, perTopic - before)
        let localCreated = 0
        if (!dryRun && needed > 0) {
          for (let i = 1; i <= needed; i++) {
            const qText = `(${i}/${perTopic}) ${topicName} in ${subjectsRes.docs.find((s: any) => s.id === subjectId)?.name || 'Subject'}: Choose the correct statement.`
            const difficulty = i % 3 === 0 ? 'hard' : i % 3 === 1 ? 'easy' : 'medium'
            await payload.create({
              collection: 'mcq',
              data: {
                // @ts-ignore the type of question is lexicalText
                question: lexicalText(qText),
                options: makeOptions(topicName, i),
                // @ts-ignore the type of explanation is lexicalText
                explanation: lexicalText('Review the properties and definitions for this topic.'),
                academicLevel: levelId,
                subject: subjectId,
                topic: [topicId],
                difficulty,
              },
            })
            created++
            localCreated++
          }
        }
        perTopicSummary[`${topicId}:${subjectId}`] = {
          before,
          after: before + localCreated,
          created: localCreated,
        }
      }
    }

    return NextResponse.json({
      success: true,
      levelId,
      perTopic,
      dryRun,
      created,
      topicsProcessed: topicsRes.totalDocs,
      summaryEntries: Object.keys(perTopicSummary).length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
