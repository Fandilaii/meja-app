import { NextResponse } from 'next/server'
import { sendWhatsApp, buildConfirmationMessage } from '@/lib/fonnte'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone, message, name, restaurantName, date, time, guestCount, referenceCode } = body

    if (!phone) {
      return NextResponse.json({ error: 'phone required' }, { status: 400 })
    }

    // If full params provided, build confirmation template; otherwise use raw message
    const finalMessage = message
      ?? buildConfirmationMessage({ name, restaurantName, date, time, guestCount, referenceCode })

    const result = await sendWhatsApp(phone, finalMessage)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('[WhatsApp API]', err)
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
