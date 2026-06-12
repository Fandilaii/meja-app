import { NextResponse } from 'next/server'
import { getTomorrowReservations, getRestaurantName } from '@/lib/firestore-admin'
import { sendWhatsApp, buildReminderMessage } from '@/lib/fonnte'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Verify Vercel cron secret (Vercel injects Authorization header automatically)
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return NextResponse.json(
      { error: 'FIREBASE_SERVICE_ACCOUNT_JSON not configured — skipping cron run' },
      { status: 503 }
    )
  }

  try {
    const reservations = await getTomorrowReservations()

    if (reservations.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No reservations for tomorrow' })
    }

    // Batch-fetch unique restaurant names
    const restaurantIds = [...new Set(reservations.map((r) => r.restaurantId))]
    const nameMap = new Map<string, string>()
    await Promise.all(
      restaurantIds.map(async (id) => {
        nameMap.set(id, await getRestaurantName(id))
      })
    )

    // Send WA reminders
    const results = await Promise.allSettled(
      reservations.map((r) => {
        const message = buildReminderMessage({
          name:           r.guestName,
          restaurantName: nameMap.get(r.restaurantId) ?? 'Restoran',
          date:           r.date,
          timeSlot:       r.timeSlot,
          guestCount:     r.guestCount,
          referenceCode:  r.referenceCode,
        })
        return sendWhatsApp(r.guestPhone, message)
      })
    )

    const sent   = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    console.log(`[cron/reminders] sent=${sent} failed=${failed} total=${reservations.length}`)
    return NextResponse.json({ sent, failed, total: reservations.length })
  } catch (err) {
    console.error('[cron/reminders]', err)
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
