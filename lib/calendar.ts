import type { Reservation } from '@/types'

function toCalDate(date: string, timeSlot: string): string {
  const [y, m, d] = date.split('-')
  const [h, min]  = timeSlot.split(':')
  return `${y}${m}${d}T${h}${min}00`
}

function addHours(calDate: string, hours: number): string {
  const [datePart, timePart] = [calDate.slice(0, 8), calDate.slice(9)]
  const [h, min, sec] = [
    parseInt(timePart.slice(0, 2)) + hours,
    timePart.slice(2, 4),
    timePart.slice(4, 6),
  ]
  return `${datePart}T${String(h).padStart(2, '0')}${min}${sec}`
}

export function buildGoogleCalendarUrl(r: Reservation, restaurantName: string): string {
  const start   = toCalDate(r.date, r.timeSlot)
  const end     = addHours(start, 2)
  const text    = encodeURIComponent(`Reservasi di ${restaurantName}`)
  const details = encodeURIComponent(`Kode reservasi: ${r.referenceCode}\nTamu: ${r.guestCount} orang`)
  const loc     = encodeURIComponent(restaurantName)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${loc}`
}

export function downloadICS(r: Reservation, restaurantName: string): void {
  const start = toCalDate(r.date, r.timeSlot)
  const end   = addHours(start, 2)
  const now   = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const uid   = `${r.id}@meja-app`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Meja//Reservation//ID',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:Reservasi di ${restaurantName}`,
    `DESCRIPTION:Kode: ${r.referenceCode}\\nTamu: ${r.guestCount} orang`,
    `LOCATION:${restaurantName}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `meja-${r.referenceCode}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
