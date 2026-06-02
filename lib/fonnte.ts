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
