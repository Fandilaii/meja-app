export async function sendWhatsApp(phone: string, message: string) {
  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      Authorization:  process.env.FONNTE_API_TOKEN!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target:      phone,
      message,
      countryCode: '62',
    }),
  })
  return response.json()
}

export function buildReminderMessage(params: {
  name:           string
  restaurantName: string
  date:           string
  timeSlot:       string
  guestCount:     number
  referenceCode:  string
}): string {
  const { name, restaurantName, date, timeSlot, guestCount, referenceCode } = params
  const [y, m, d] = date.split('-').map(Number)
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  return `Halo ${name}! 👋\n\nMengingatkan reservasimu *besok*:\n\n🍽️ *${restaurantName}*\n📅 ${dateLabel}\n⏰ ${timeSlot} WIB\n👥 ${guestCount} orang\n\nKode: *${referenceCode}*\n\nSampai jumpa! Mejamu sudah menunggu. 🪑\n— Tim Meja`
}

export function buildConfirmationMessage(params: {
  name:           string
  restaurantName: string
  date:           string
  time:           string
  guestCount:     number
  referenceCode:  string
}): string {
  const { name, restaurantName, date, time, guestCount, referenceCode } = params
  return `Halo ${name}! 👋\nReservasi kamu di *Meja* berhasil dikonfirmasi.\n\n🍽️ *${restaurantName}*\n📅 ${date}\n⏰ ${time} WIB\n👥 ${guestCount} orang\n\nKode reservasi: *${referenceCode}*\n\nSampai jumpa! Mejamu sudah menunggu. 🪑\n— Tim Meja`
}
