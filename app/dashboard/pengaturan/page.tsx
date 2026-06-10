'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Pencil, Check, X, Loader2, KeyRound, Mail } from 'lucide-react'
import { getRestaurant, updateRestaurant } from '@/lib/firestore'
import { onAuthStateChange, sendPasswordReset } from '@/lib/auth'
import type { Restaurant } from '@/types'
import type { User } from 'firebase/auth'

const RESTAURANT_ID = 'P3R1nyDl8sqYukKkculP'

type EditableField = 'name' | 'area' | 'cuisine' | 'openTime' | 'closeTime' | 'totalTables'

const FIELD_CONFIG: { key: EditableField; label: string; type: 'text' | 'time' | 'number'; options?: string[] }[] = [
  { key: 'name',        label: 'Nama Restoran',  type: 'text'   },
  { key: 'area',        label: 'Area',           type: 'text',   options: ['SCBD', 'Kemang', 'PIK', 'Menteng'] },
  { key: 'cuisine',     label: 'Jenis Masakan',  type: 'text'   },
  { key: 'openTime',    label: 'Jam Buka',       type: 'time'   },
  { key: 'closeTime',   label: 'Jam Tutup',      type: 'time'   },
  { key: 'totalTables', label: 'Total Meja',     type: 'number' },
]

export default function PengaturanPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [user,       setUser]       = useState<User | null>(null)
  const [editing,    setEditing]    = useState<EditableField | null>(null)
  const [editValue,  setEditValue]  = useState<string>('')
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState<string | null>(null)
  const [pwStatus,   setPwStatus]   = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    getRestaurant(RESTAURANT_ID).then((r) => { setRestaurant(r); setLoading(false) })
  }, [])

  useEffect(() => {
    return onAuthStateChange(setUser)
  }, [])

  function startEdit(field: EditableField) {
    if (!restaurant) return
    setEditing(field)
    setEditValue(String(restaurant[field]))
    setSaveError(null)
  }

  function cancelEdit() {
    setEditing(null)
    setEditValue('')
    setSaveError(null)
  }

  async function saveEdit(field: EditableField) {
    if (!restaurant) return
    setSaveError(null)

    // Validate
    const raw = editValue.trim()
    if (!raw) { setSaveError('Nilai tidak boleh kosong.'); return }
    if (field === 'totalTables') {
      const n = parseInt(raw, 10)
      if (isNaN(n) || n < 1 || n > 200) { setSaveError('Total meja harus 1–200.'); return }
    }
    if (field === 'area' && !['SCBD', 'Kemang', 'PIK', 'Menteng'].includes(raw)) {
      setSaveError('Area tidak valid.'); return
    }

    const value = field === 'totalTables' ? parseInt(raw, 10) : raw

    setSaving(true)
    try {
      await updateRestaurant(RESTAURANT_ID, { [field]: value })
      setRestaurant((r) => r ? { ...r, [field]: value } : r)
      setEditing(null)
    } catch {
      setSaveError('Gagal menyimpan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) return
    setPwStatus('sending')
    try {
      await sendPasswordReset(user.email)
      setPwStatus('sent')
      setTimeout(() => setPwStatus('idle'), 5000)
    } catch {
      setPwStatus('error')
      setTimeout(() => setPwStatus('idle'), 4000)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="p-6">
        <p className="text-sm font-sans text-ink/60">Data restoran tidak ditemukan.</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="font-display font-bold text-ink text-2xl">Pengaturan</h1>
        <p className="text-sm font-sans text-ink/60 mt-0.5">Konfigurasi restoran dan akun</p>
      </div>

      {/* Restaurant settings */}
      <section className="bg-white border border-meja-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-meja-border">
          <h2 className="font-display font-semibold text-ink text-base">Informasi Restoran</h2>
        </div>

        <div className="divide-y divide-meja-border/60">
          {FIELD_CONFIG.map(({ key, label, type, options }) => {
            const isEditing = editing === key
            const value     = restaurant[key]

            return (
              <div key={key} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-sans font-medium text-ink/50 uppercase tracking-wider mb-1">
                    {label}
                  </p>

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      {options ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gold/60 text-ink font-sans text-sm focus:outline-none bg-white"
                        >
                          {options.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={type}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gold/60 text-ink font-sans text-sm focus:outline-none"
                        />
                      )}
                      {saveError && editing === key && (
                        <p className="text-[11px] font-sans text-terra">{saveError}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-sans font-medium text-ink">
                      {type === 'time' ? `${value} WIB` : String(value)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEdit(key)}
                        disabled={saving}
                        className="w-8 h-8 rounded-full bg-forest-light text-forest flex items-center justify-center hover:bg-forest/20 transition-colors disabled:opacity-60"
                      >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="w-8 h-8 rounded-full bg-sand text-ink/60 flex items-center justify-center hover:bg-sand/80 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(key)}
                      className="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center text-ink/40 hover:text-ink/70 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Account section */}
      <section className="bg-white border border-meja-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-meja-border">
          <h2 className="font-display font-semibold text-ink text-base">Akun Manager</h2>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sand flex items-center justify-center flex-shrink-0">
              <Mail size={15} className="text-ink/60" />
            </div>
            <div>
              <p className="text-[10px] font-sans font-medium text-ink/50 uppercase tracking-wider">Email</p>
              <p className="text-sm font-sans font-medium text-ink">{user?.email ?? '—'}</p>
            </div>
          </div>

          {/* Reset password */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-sans font-medium text-ink">Kata Sandi</p>
              <p className="text-xs font-sans text-ink/50">
                {pwStatus === 'sent'
                  ? 'Email reset dikirim! Cek inbox kamu.'
                  : pwStatus === 'error'
                    ? 'Gagal mengirim. Coba lagi.'
                    : 'Kirim tautan reset ke email kamu'
                }
              </p>
            </div>
            <button
              onClick={handlePasswordReset}
              disabled={pwStatus === 'sending' || pwStatus === 'sent'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors disabled:opacity-60
                ${pwStatus === 'sent'
                  ? 'bg-forest-light text-forest'
                  : 'border border-meja-border text-ink/70 hover:bg-sand'
                }`}
            >
              {pwStatus === 'sending' && <Loader2 size={13} className="animate-spin" />}
              <KeyRound size={13} />
              {pwStatus === 'sent' ? 'Terkirim!' : 'Reset Kata Sandi'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
