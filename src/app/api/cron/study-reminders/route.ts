import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

// Cron endpoint — checks for study reminders due within the next 30 minutes
// and sends an in-app notification.
//
// Trigger options:
//   Vercel: add "*/30 * * * *" in vercel.json crons config pointing to this path
//   VPS: call this route every 30 min via node-cron or system cron
//
// Security: requires Authorization: Bearer <CRON_SECRET> header.

export async function GET(request: NextRequest) {
  // Verify cron secret
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const now = new Date()
    const windowEnd = new Date(now.getTime() + 30 * 60 * 1000) // 30 min from now

    // Find all active study plans with unsent reminders due in the next 30 min
    const plans = await payload.find({
      collection: 'study-plans',
      where: { isActive: { equals: true } },
      limit: 500,
      depth: 1, // populate user
    })

    let sent = 0
    let errors = 0

    for (const plan of plans.docs) {
      const userId = typeof plan.user === 'string' ? plan.user : (plan.user as any)?.id

      if (!userId) continue

      const reminders = (plan.studyReminders ?? []) as NonNullable<typeof plan.studyReminders>

      for (const reminder of reminders) {
        if (!reminder.isActive || reminder.isSent) continue

        const reminderAt = new Date(reminder.reminderTime)
        if (reminderAt < now || reminderAt > windowEnd) continue

        try {
          // 1. Create in-app notification
          await payload.create({
            collection: 'notifications',
            data: {
              recipient: userId,
              title: reminder.title,
              message:
                reminder.message ??
                `Your study session starts at ${reminderAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
              type: 'study_plan',
              isRead: false,
              actionLink: '/dashboard/planner',
            } as any,
          })

          // 2. Mark reminder as sent
          const updatedReminders = reminders.map((r) =>
            r.id === reminder.id ? { ...r, isSent: true, sentAt: now.toISOString() } : r,
          )
          await payload.update({
            collection: 'study-plans',
            id: plan.id as string,
            data: { studyReminders: updatedReminders } as any,
          })

          sent++
        } catch (err) {
          console.error(`[cron/study-reminders] Failed for plan ${plan.id}:`, err)
          errors++
        }
      }
    }

    return NextResponse.json({
      ok: true,
      checked: plans.docs.length,
      sent,
      errors,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[cron/study-reminders] Fatal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
