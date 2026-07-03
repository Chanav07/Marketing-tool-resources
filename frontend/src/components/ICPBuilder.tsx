import { useEffect, useState } from 'react'
import { api } from '../api'
import { MAX_PERSONAS, type Brand, type Persona, type PersonaInput, type VariantInput } from '../types'

interface Draft {
  name: string
  description: string
  variants: { label: string; description: string }[]
}

const EMPTY_DRAFT: Draft = { name: '', description: '', variants: [] }

function toDraft(p: Persona): Draft {
  return {
    name: p.name,
    description: p.description ?? '',
    variants: p.variants.map((v) => ({ label: v.label, description: v.description ?? '' })),
  }
}

function toPayload(d: Draft): PersonaInput {
  const variants: VariantInput[] = d.variants
    .filter((v) => v.label.trim())
    .map((v) => ({ label: v.label.trim(), description: v.description.trim() || null }))
  return { name: d.name.trim(), description: d.description.trim() || null, variants }
}

export function ICPBuilder() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [brandId, setBrandId] = useState<string>('')
  const [personas, setPersonas] = useState<Persona[]>([])
  const [editingId, setEditingId] = useState<string | null>(null) // persona id or 'new'
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.listBrands().then((bs) => {
      setBrands(bs)
      if (bs.length && !brandId) setBrandId(bs[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!brandId) {
      setPersonas([])
      return
    }
    setEditingId(null)
    api.listPersonas(brandId).then(setPersonas).catch((e) => setError(e.message))
  }, [brandId])

  function startNew() {
    setEditingId('new')
    setDraft(EMPTY_DRAFT)
    setError(null)
  }

  function startEdit(p: Persona) {
    setEditingId(p.id)
    setDraft(toDraft(p))
    setError(null)
  }

  function cancel() {
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
    setError(null)
  }

  function setVariant(i: number, key: 'label' | 'description', value: string) {
    setDraft((d) => {
      const variants = d.variants.map((v, idx) => (idx === i ? { ...v, [key]: value } : v))
      return { ...d, variants }
    })
  }

  function addVariant() {
    setDraft((d) => ({ ...d, variants: [...d.variants, { label: '', description: '' }] }))
  }

  function removeVariant(i: number) {
    setDraft((d) => ({ ...d, variants: d.variants.filter((_, idx) => idx !== i) }))
  }

  async function save() {
    if (!draft.name.trim()) {
      setError('Persona name is required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload = toPayload(draft)
      if (editingId === 'new') {
        await api.createPersona(brandId, payload)
      } else if (editingId) {
        await api.updatePersona(editingId, payload)
      }
      const fresh = await api.listPersonas(brandId)
      setPersonas(fresh)
      cancel()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(p: Persona) {
    if (!confirm(`Delete persona "${p.name}"?`)) return
    await api.deletePersona(p.id)
    setPersonas((prev) => prev.filter((x) => x.id !== p.id))
  }

  const atCap = personas.length >= MAX_PERSONAS

  return (
    <div className="phase-body">
      <header className="phase-head">
        <span className="phase-tag">Phase 2 · User provides</span>
        <h1>ICP builder</h1>
        <p>Who you sell to — up to five core personas, each able to flex into situational variants.</p>
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
        {brandId && (
          <div className="cap-row">
            <span className="count-pill">{personas.length} / {MAX_PERSONAS} personas</span>
            <button onClick={startNew} disabled={atCap || editingId === 'new'}>
              + Add persona
            </button>
          </div>
        )}
      </div>

      {!brandId && (
        <div className="card muted">Create a brand in <strong>Brand inputs</strong> first, then build its personas here.</div>
      )}

      {brandId && (
        <div className="persona-stack">
          {editingId === 'new' && (
            <PersonaEditor
              draft={draft}
              busy={busy}
              error={error}
              onField={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
              onVariant={setVariant}
              onAddVariant={addVariant}
              onRemoveVariant={removeVariant}
              onSave={save}
              onCancel={cancel}
              title="New persona"
            />
          )}

          {personas.length === 0 && editingId !== 'new' && (
            <div className="card muted">No personas yet. Add your first buyer type.</div>
          )}

          {personas.map((p) =>
            editingId === p.id ? (
              <PersonaEditor
                key={p.id}
                draft={draft}
                busy={busy}
                error={error}
                onField={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
                onVariant={setVariant}
                onAddVariant={addVariant}
                onRemoveVariant={removeVariant}
                onSave={save}
                onCancel={cancel}
                title="Edit persona"
              />
            ) : (
              <div className="card persona-card" key={p.id}>
                <div className="persona-card-head">
                  <div>
                    <h3>{p.name}</h3>
                    {p.description && <p className="muted">{p.description}</p>}
                  </div>
                  <div className="row-actions">
                    <button className="ghost" onClick={() => startEdit(p)}>Edit</button>
                    <button className="ghost danger" onClick={() => remove(p)}>Delete</button>
                  </div>
                </div>
                {p.variants.length > 0 && (
                  <ul className="variant-list">
                    {p.variants.map((v) => (
                      <li key={v.id}>
                        <strong>{v.label}</strong>
                        {v.description && <span> — {v.description}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

interface EditorProps {
  draft: Draft
  busy: boolean
  error: string | null
  title: string
  onField: (key: 'name' | 'description', value: string) => void
  onVariant: (i: number, key: 'label' | 'description', value: string) => void
  onAddVariant: () => void
  onRemoveVariant: (i: number) => void
  onSave: () => void
  onCancel: () => void
}

function PersonaEditor(p: EditorProps) {
  return (
    <form
      className="card form persona-editor"
      onSubmit={(e) => {
        e.preventDefault()
        p.onSave()
      }}
    >
      <h3>{p.title}</h3>
      <label className="field">
        <span className="field-label">Persona name *</span>
        <input
          value={p.draft.name}
          onChange={(e) => p.onField('name', e.target.value)}
          placeholder="e.g. Busy professional couple"
        />
      </label>
      <label className="field">
        <span className="field-label">Description</span>
        <textarea
          rows={2}
          value={p.draft.description}
          onChange={(e) => p.onField('description', e.target.value)}
          placeholder="Who they are and what they need."
        />
      </label>

      <div className="variants-block">
        <div className="variants-head">
          <span className="field-label">Variants</span>
          <span className="field-why">Sub-groups within this persona for slightly different situations.</span>
        </div>
        {p.draft.variants.map((v, i) => (
          <div className="variant-row" key={i}>
            <input
              value={v.label}
              onChange={(e) => p.onVariant(i, 'label', e.target.value)}
              placeholder="Variant label (e.g. Big-city premium tier)"
            />
            <input
              value={v.description}
              onChange={(e) => p.onVariant(i, 'description', e.target.value)}
              placeholder="Optional detail"
            />
            <button type="button" className="ghost danger" onClick={() => p.onRemoveVariant(i)}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="ghost" onClick={p.onAddVariant}>
          + Add variant
        </button>
      </div>

      {p.error && <div className="alert">{p.error}</div>}
      <div className="actions">
        <button type="submit" disabled={p.busy}>
          {p.busy ? 'Saving…' : 'Save persona'}
        </button>
        <button type="button" className="ghost" onClick={p.onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
