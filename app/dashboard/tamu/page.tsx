export default function TamuPage() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-gold-light flex items-center justify-center mx-auto mb-5 text-3xl">
          👥
        </div>
        <h1 className="font-display font-bold text-ink text-2xl mb-2">Tamu</h1>
        <p className="text-sm font-sans text-muted mb-1">Direktori tamu dan riwayat</p>
        <p className="text-xs font-sans text-muted/60 mt-4 bg-sand rounded-xl px-4 py-2.5 inline-block">
          Segera hadir · Sprint berikutnya
        </p>
      </div>
    </div>
  )
}
