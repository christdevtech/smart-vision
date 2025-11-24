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

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = (request as any)

    if (!isAuthorized(request, user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const subjectsData = [
      'Mathematics',
      'Further Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'English Language',
      'French',
      'Literature in English',
      'History',
      'Geography',
      'Economics',
      'Commerce',
      'Accounting',
      'Computer Science',
      'Philosophy',
      'Citizenship Education',
      'Religious Studies',
      'Agriculture Science',
      'Home Economics',
    ]

    const topicsData: { name: string; subjectNames: string[] }[] = [
      { name: 'Algebra', subjectNames: ['Mathematics'] },
      { name: 'Geometry', subjectNames: ['Mathematics'] },
      { name: 'Trigonometry', subjectNames: ['Mathematics'] },
      { name: 'Functions', subjectNames: ['Mathematics'] },
      { name: 'Statistics', subjectNames: ['Mathematics', 'Further Mathematics'] },
      { name: 'Probability', subjectNames: ['Mathematics'] },
      { name: 'Calculus', subjectNames: ['Mathematics', 'Further Mathematics'] },
      { name: 'Matrices', subjectNames: ['Mathematics', 'Further Mathematics'] },
      { name: 'Vectors', subjectNames: ['Mathematics', 'Further Mathematics'] },
      { name: 'Number Systems', subjectNames: ['Mathematics'] },

      { name: 'Advanced Calculus', subjectNames: ['Further Mathematics'] },
      { name: 'Complex Numbers', subjectNames: ['Further Mathematics'] },
      { name: 'Differential Equations', subjectNames: ['Further Mathematics'] },
      { name: 'Mechanics', subjectNames: ['Further Mathematics', 'Physics'] },

      { name: 'Waves', subjectNames: ['Physics'] },
      { name: 'Optics', subjectNames: ['Physics'] },
      { name: 'Electricity', subjectNames: ['Physics'] },
      { name: 'Magnetism', subjectNames: ['Physics'] },
      { name: 'Thermal Physics', subjectNames: ['Physics'] },
      { name: 'Modern Physics', subjectNames: ['Physics'] },

      { name: 'Atomic Structure', subjectNames: ['Chemistry'] },
      { name: 'Periodic Table', subjectNames: ['Chemistry'] },
      { name: 'Chemical Bonding', subjectNames: ['Chemistry'] },
      { name: 'Stoichiometry', subjectNames: ['Chemistry'] },
      { name: 'Acids and Bases', subjectNames: ['Chemistry'] },
      { name: 'Redox Reactions', subjectNames: ['Chemistry'] },
      { name: 'Organic Chemistry', subjectNames: ['Chemistry'] },
      { name: 'Inorganic Chemistry', subjectNames: ['Chemistry'] },
      { name: 'Thermochemistry', subjectNames: ['Chemistry'] },
      { name: 'Chemical Equilibrium', subjectNames: ['Chemistry'] },

      { name: 'Cell Biology', subjectNames: ['Biology'] },
      { name: 'Genetics', subjectNames: ['Biology'] },
      { name: 'Evolution', subjectNames: ['Biology'] },
      { name: 'Ecology', subjectNames: ['Biology'] },
      { name: 'Human Physiology', subjectNames: ['Biology'] },
      { name: 'Plant Physiology', subjectNames: ['Biology'] },
      { name: 'Reproduction', subjectNames: ['Biology'] },
      { name: 'Classification', subjectNames: ['Biology'] },
      { name: 'Microbiology', subjectNames: ['Biology'] },

      { name: 'Grammar', subjectNames: ['English Language', 'French'] },
      { name: 'Comprehension', subjectNames: ['English Language', 'French'] },
      { name: 'Summary Writing', subjectNames: ['English Language'] },
      { name: 'Essay Writing', subjectNames: ['English Language', 'French'] },
      { name: 'Oral', subjectNames: ['English Language', 'French'] },
      { name: 'Vocabulaire', subjectNames: ['French'] },
      { name: 'Production écrite', subjectNames: ['French'] },

      { name: 'Poetry', subjectNames: ['Literature in English'] },
      { name: 'Prose', subjectNames: ['Literature in English'] },
      { name: 'Drama', subjectNames: ['Literature in English'] },
      { name: 'Literary Devices', subjectNames: ['Literature in English'] },
      { name: 'African Literature', subjectNames: ['Literature in English'] },

      { name: 'Cameroon History', subjectNames: ['History'] },
      { name: 'African History', subjectNames: ['History'] },
      { name: 'World History', subjectNames: ['History'] },
      { name: 'Colonialism', subjectNames: ['History'] },
      { name: 'Independence Movements', subjectNames: ['History'] },

      { name: 'Physical Geography', subjectNames: ['Geography'] },
      { name: 'Human Geography', subjectNames: ['Geography'] },
      { name: 'Map Reading', subjectNames: ['Geography'] },
      { name: 'Climatology', subjectNames: ['Geography'] },
      { name: 'Geomorphology', subjectNames: ['Geography'] },
      { name: 'Population', subjectNames: ['Geography'] },

      { name: 'Microeconomics', subjectNames: ['Economics'] },
      { name: 'Macroeconomics', subjectNames: ['Economics'] },
      { name: 'Development Economics', subjectNames: ['Economics'] },
      { name: 'International Trade', subjectNames: ['Economics'] },
      { name: 'Public Finance', subjectNames: ['Economics'] },

      { name: 'Business Environment', subjectNames: ['Commerce'] },
      { name: 'Marketing', subjectNames: ['Commerce'] },
      { name: 'Banking', subjectNames: ['Commerce'] },
      { name: 'Trade', subjectNames: ['Commerce'] },
      { name: 'Insurance', subjectNames: ['Commerce'] },

      { name: 'Financial Accounting', subjectNames: ['Accounting'] },
      { name: 'Cost Accounting', subjectNames: ['Accounting'] },
      { name: 'Double Entry', subjectNames: ['Accounting'] },
      { name: 'Final Accounts', subjectNames: ['Accounting'] },
      { name: 'Accounting Concepts', subjectNames: ['Accounting'] },

      { name: 'Programming', subjectNames: ['Computer Science'] },
      { name: 'Algorithms', subjectNames: ['Computer Science'] },
      { name: 'Data Structures', subjectNames: ['Computer Science'] },
      { name: 'Databases', subjectNames: ['Computer Science'] },
      { name: 'Operating Systems', subjectNames: ['Computer Science'] },
      { name: 'Networking', subjectNames: ['Computer Science'] },

      { name: 'Logic', subjectNames: ['Philosophy'] },
      { name: 'Ethics', subjectNames: ['Philosophy'] },
      { name: 'Epistemology', subjectNames: ['Philosophy'] },
      { name: 'Metaphysics', subjectNames: ['Philosophy'] },
      { name: 'Political Philosophy', subjectNames: ['Philosophy'] },

      { name: 'Civics', subjectNames: ['Citizenship Education'] },
      { name: 'Rights and Duties', subjectNames: ['Citizenship Education'] },
      { name: 'Governance', subjectNames: ['Citizenship Education'] },
      { name: 'Constitution', subjectNames: ['Citizenship Education'] },

      { name: 'Old Testament', subjectNames: ['Religious Studies'] },
      { name: 'New Testament', subjectNames: ['Religious Studies'] },
      { name: 'Church History', subjectNames: ['Religious Studies'] },
      { name: 'Religious Ethics', subjectNames: ['Religious Studies'] },

      { name: 'Crop Production', subjectNames: ['Agriculture Science'] },
      { name: 'Animal Science', subjectNames: ['Agriculture Science'] },
      { name: 'Soil Science', subjectNames: ['Agriculture Science'] },
      { name: 'Agricultural Economics', subjectNames: ['Agriculture Science'] },

      { name: 'Food and Nutrition', subjectNames: ['Home Economics'] },
      { name: 'Clothing and Textiles', subjectNames: ['Home Economics'] },
      { name: 'Home Management', subjectNames: ['Home Economics'] },
      { name: 'Consumer Education', subjectNames: ['Home Economics'] },
    ]

    const createdSubjects: any[] = []
    const updatedSubjects: any[] = []
    const subjectIdByName: Record<string, string> = {}

    for (const name of subjectsData) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const existing = await payload.find({ collection: 'subjects', where: { slug: { equals: slug } }, limit: 1 })
      if (existing.docs[0]) {
        subjectIdByName[name] = existing.docs[0].id
        updatedSubjects.push({ id: existing.docs[0].id, name })
      } else {
        const created = await payload.create({ collection: 'subjects', data: { name } })
        subjectIdByName[name] = created.id
        createdSubjects.push({ id: created.id, name })
      }
    }

    const createdTopics: any[] = []
    const updatedTopics: any[] = []

    for (const t of topicsData) {
      const name = t.name
      const existing = await payload.find({ collection: 'topics', where: { name: { equals: name } }, limit: 1 })
      const subjectIds = t.subjectNames.map((n) => subjectIdByName[n]).filter(Boolean)
      if (!subjectIds.length) continue
      if (existing.docs[0]) {
        const currentSubjects = existing.docs[0].subjects || []
        const currentIds = currentSubjects.map((s: any) => (typeof s === 'string' ? s : s.id))
        const merged = Array.from(new Set([...currentIds, ...subjectIds]))
        const updated = await payload.update({ collection: 'topics', id: existing.docs[0].id, data: { subjects: merged } })
        updatedTopics.push({ id: updated.id, name })
      } else {
        const created = await payload.create({ collection: 'topics', data: { name, subjects: subjectIds } })
        createdTopics.push({ id: created.id, name })
      }
    }

    return NextResponse.json({
      success: true,
      subjects: { created: createdSubjects.length, updated: updatedSubjects.length },
      topics: { created: createdTopics.length, updated: updatedTopics.length },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

