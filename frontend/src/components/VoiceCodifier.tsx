import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Brand } from '../types'

export function VoiceCodifier() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [brandId, setBrandId] = useState<string>('')
  const [samples, setSamples] = useState<string[]>([])
  const [banned, setBanned] = useState<string[]>([])
  const [bannedDraft, setBannedDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.listBrands().then((bs) => {
      setBrands(bs)
      if (bs.length && !brandId) setBrandId(bs[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!brandId) return
    setLoading(true)
    setSavedAt(null)
    setError(null)
    api
      .getVoice(brandId)
      .then((v) => {
        setSamples(v.samples)
        setBanned(v.banned_terms)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [brandId])

  // Samples
  const addSample = () => setSamples((s) => [...s, ''])
  const setSample = (i: number, v: string) =>
    setSamples((s) => s.map((x, idx) => (idx === i ? v : x)))
  const removeSample = (i: number) => setSamples((s) => s.filter((_, idx) => idx !== i))

  // Banned terms (chips)
  function commitBanned() {
    const parts = bannedDraft
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (!parts.length) return
    setBanned((b) => {
      const lower = new Set(b.map((x) => x.toLowerCase()))
      const next = [...b]
      for (const p of parts) if (!lower.has(p.toLowerCase())) next.push(p)
      return next
    })
    setBannedDraft('')
  }
  const removeBanned = (i: number) => setBanned((b) => b.filter((_, idx) => idx !== i))

  async function save() {
    setError(null)
    const cleanSamples = samples.map((s) => s.trim()).filter(Boolean)
    setSaving(true)
    try {
      const saved = await api.putVoice(brandId, {
        samples: cleanSamples,
        banned_terms: banned,
        rewrite_pairs: [],
      })
      setSamples(saved.samples)
      setBanned(saved.banned_terms)
      setSavedAt(new Date().toLocaleTimeString())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="phase-body">
      <header className="phase-head">
        <span className="phase-tag">Phase 3 · User provides</span>
        <h1>Voice codifier</h1>
        <p>Teach the tool your voice: copy you love and words to never use.</p>
      </header>

      <div className="icp-toolbar">
        <label className="brand-select">
          <span>Brand</span>
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            {brands.length === 0 && <option value="">No brands yet</option>}
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!brandId && (
        <div className="card muted">Create a brand in <strong>Brand inputs</strong> first.</div>
      )}

      {brandId && !loading && (
        <div className="voice-stack">
          {/* Samples */}
          <section className="card">
            <h3>Copy samples you love</h3>
            <p className="field-why">3–5 real examples teach your voice better than adjectives.</p>
            {samples.map((s, i) => (
              <div className="stack-row" key={i}>
                <textarea
                  rows={2}
                  value={s}
                  onChange={(e) => setSample(i, e.target.value)}
                  placeholder="Paste a line or short piece of copy you love."
                />
                <button type="button" className="ghost danger" onClick={() => removeSample(i)}>
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="ghost" onClick={addSample}>
              + Add sample
            </button>
          </section>

          {/* Banned terms */}
          <section className="card">
            <h3>Banned words &amp; phrases</h3>
            <p className="field-why">Exact terms that must never appear. The linter flags any match.</p>
            <div className="chip-input">
              <input
                value={bannedDraft}
                onChange={(e) => setBannedDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    commitBanned()
                  }
                }}
                placeholder="Type a term, press Enter (or comma)"
              />
              <button type="button" className="ghost" onClick={commitBanned}>
                Add
              </button>
            </div>
            {banned.length > 0 && (
              <div className="chips">
                {banned.map((t, i) => (
                  <span className="chip" key={i}>
                    {t}
                    <button type="button" onClick={() => removeBanned(i)}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {error && <div className="alert">{error}</div>}
          <div className="actions sticky-save">
            <button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save voice profile'}
            </button>
            {savedAt && <span className="saved">Saved at {savedAt}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
