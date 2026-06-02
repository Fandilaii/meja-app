import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', 'app', 'dashboard')

const pages = [
  { dir: 'kalender',   label: 'Kalender',   icon: '📅', desc: 'Jadwal reservasi mingguan'     },
  { dir: 'meja',       label: 'Meja',        icon: '🪑', desc: 'Kelola status meja restoran'    },
  { dir: 'waitlist',   label: 'Waitlist',    icon: '⏳', desc: 'Antrian tamu menunggu'          },
  { dir: 'tamu',       label: 'Tamu',        icon: '👥', desc: 'Direktori tamu dan riwayat'     },
  { dir: 'laporan',    label: 'Laporan',     icon: '📊', desc: 'Analitik dan performa restoran' },
  { dir: 'pengaturan', label: 'Pengaturan',  icon: '⚙️', desc: 'Konfigurasi restoran dan akun'  },
]

for (const { dir, label, icon, desc } of pages) {
  const content = `export default function ${label.replace(/[^a-zA-Z]/g, '')}Page() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-gold-light flex items-center justify-center mx-auto mb-5 text-3xl">
          ${icon}
        </div>
        <h1 className="font-display font-bold text-ink text-2xl mb-2">${label}</h1>
        <p className="text-sm font-sans text-muted mb-1">${desc}</p>
        <p className="text-xs font-sans text-muted/60 mt-4 bg-sand rounded-xl px-4 py-2.5 inline-block">
          Segera hadir · Sprint berikutnya
        </p>
      </div>
    </div>
  )
}
`
  writeFileSync(join(root, dir, 'page.tsx'), content)
  console.log(`✅ Created /dashboard/${dir}/page.tsx`)
}
